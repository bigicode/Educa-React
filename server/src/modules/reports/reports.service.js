import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const reportRoles = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Class";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function roundNumber(value) {
  return Math.round(value * 10) / 10;
}

function toStartOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toEndOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

async function getAccessibleScope({ userId, role, filters = {} }) {
  if (!reportRoles.has(role)) {
    throw new AppError("Reports are not available for this account yet.", 403);
  }

  const activeAcademicYear =
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        terms: {
          orderBy: [{ startDate: "asc" }],
        },
      },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      include: {
        terms: {
          orderBy: [{ startDate: "asc" }],
        },
      },
    }));

  const selectedAcademicYear =
    (filters.academicYearId &&
      (await prisma.academicYear.findUnique({
        where: { id: filters.academicYearId },
        include: {
          terms: {
            orderBy: [{ startDate: "asc" }],
          },
        },
      }))) ||
    activeAcademicYear;

  if (!selectedAcademicYear) {
    throw new AppError("No academic year is configured yet.", 400);
  }

  const selectedTerm = filters.termId
    ? selectedAcademicYear.terms.find((term) => term.id === filters.termId) || null
    : selectedAcademicYear.terms.find((term) => term.isActive) || selectedAcademicYear.terms[0] || null;

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: { userId },
      include: {
        homeroomClasses: {
          select: {
            id: true,
            name: true,
            level: true,
            section: true,
          },
        },
        subjectAssignments: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            schoolClass: {
              select: {
                id: true,
                name: true,
                level: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new AppError("Teacher profile not found for this account.", 404);
    }

    const accessibleClassMap = new Map();
    teacher.homeroomClasses.forEach((schoolClass) => accessibleClassMap.set(schoolClass.id, schoolClass));
    teacher.subjectAssignments.forEach((assignment) => {
      if (assignment.schoolClass) {
        accessibleClassMap.set(assignment.schoolClass.id, assignment.schoolClass);
      }
    });

    const accessibleSubjectMap = new Map();
    teacher.subjectAssignments.forEach((assignment) => {
      accessibleSubjectMap.set(assignment.subject.id, assignment.subject);
    });

    const accessibleClassIds = Array.from(accessibleClassMap.keys());
    const accessibleSubjectIds = Array.from(accessibleSubjectMap.keys());

    if (filters.schoolClassId && !accessibleClassMap.has(filters.schoolClassId)) {
      throw new AppError("That class is outside your report scope.", 403);
    }

    if (filters.subjectId && !accessibleSubjectMap.has(filters.subjectId)) {
      throw new AppError("That subject is outside your report scope.", 403);
    }

    return {
      role,
      teacherId: teacher.id,
      academicYear: selectedAcademicYear,
      term: selectedTerm,
      schoolClassId: filters.schoolClassId || null,
      subjectId: filters.subjectId || null,
      dateFrom: filters.dateFrom ? toStartOfDay(filters.dateFrom) : null,
      dateTo: filters.dateTo ? toEndOfDay(filters.dateTo) : null,
      accessibleClasses: Array.from(accessibleClassMap.values()),
      accessibleClassIds,
      accessibleSubjects: Array.from(accessibleSubjectMap.values()),
      accessibleSubjectIds,
    };
  }

  const [classes, subjects] = await Promise.all([
    prisma.schoolClass.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
      },
    }),
    prisma.subject.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
      },
    }),
  ]);

  return {
    role,
    teacherId: null,
    academicYear: selectedAcademicYear,
    term: selectedTerm,
    schoolClassId: filters.schoolClassId || null,
    subjectId: filters.subjectId || null,
    dateFrom: filters.dateFrom ? toStartOfDay(filters.dateFrom) : null,
    dateTo: filters.dateTo ? toEndOfDay(filters.dateTo) : null,
    accessibleClasses: classes,
    accessibleClassIds: classes.map((schoolClass) => schoolClass.id),
    accessibleSubjects: subjects,
    accessibleSubjectIds: subjects.map((subject) => subject.id),
  };
}

function buildAttendanceWhere(scope) {
  return {
    academicYearId: scope.academicYear.id,
    ...(scope.term ? { termId: scope.term.id } : {}),
    ...(scope.schoolClassId
      ? { schoolClassId: scope.schoolClassId }
      : scope.role === "TEACHER"
        ? { schoolClassId: { in: scope.accessibleClassIds } }
        : {}),
    ...(scope.dateFrom || scope.dateTo
      ? {
          date: {
            ...(scope.dateFrom ? { gte: scope.dateFrom } : {}),
            ...(scope.dateTo ? { lte: scope.dateTo } : {}),
          },
        }
      : {}),
  };
}

function buildAssessmentWhere(scope) {
  return {
    academicYearId: scope.academicYear.id,
    ...(scope.term ? { termId: scope.term.id } : {}),
    ...(scope.schoolClassId
      ? { schoolClassId: scope.schoolClassId }
      : scope.role === "TEACHER"
        ? { schoolClassId: { in: scope.accessibleClassIds } }
        : {}),
    ...(scope.subjectId ? { subjectId: scope.subjectId } : {}),
  };
}

export async function getReportsMeta({ userId, role }) {
  const scope = await getAccessibleScope({ userId, role, filters: {} });

  return {
    scope: scope.role,
    academicYears: [
      {
        id: scope.academicYear.id,
        name: scope.academicYear.name,
        isActive: scope.academicYear.isActive,
        terms: scope.academicYear.terms.map((term) => ({
          id: term.id,
          name: term.name,
          isActive: term.isActive,
        })),
      },
    ],
    classes: scope.accessibleClasses.map((schoolClass) => ({
      id: schoolClass.id,
      label: getClassLabel(schoolClass),
      level: schoolClass.level,
    })),
    subjects: scope.accessibleSubjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
    })),
  };
}

function buildAttendanceRows(enrollments, attendanceRecords) {
  const attendanceMap = attendanceRecords.reduce((map, record) => {
    const current = map.get(record.studentId) || {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      markedCount: 0,
    };

    current[record.status] += 1;
    current.markedCount += 1;
    map.set(record.studentId, current);
    return map;
  }, new Map());

  return enrollments.map((enrollment) => {
    const counts = attendanceMap.get(enrollment.student.id) || {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      markedCount: 0,
    };
    const attended = counts.PRESENT + counts.LATE + counts.EXCUSED;
    const attendanceRate = counts.markedCount ? roundNumber((attended / counts.markedCount) * 100) : 0;

    return {
      studentId: enrollment.student.id,
      fullName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      admissionNumber: enrollment.student.admissionNumber,
      classLabel: getClassLabel(enrollment.schoolClass),
      presentCount: counts.PRESENT,
      absentCount: counts.ABSENT,
      lateCount: counts.LATE,
      excusedCount: counts.EXCUSED,
      markedCount: counts.markedCount,
      attendanceRate,
    };
  });
}

function buildAttendanceByClass(enrollments, attendanceRecords) {
  const rosterCounts = enrollments.reduce((map, enrollment) => {
    const current = map.get(enrollment.schoolClass.id) || {
      classId: enrollment.schoolClass.id,
      classLabel: getClassLabel(enrollment.schoolClass),
      rosterCount: 0,
      markedCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      presentCount: 0,
    };

    current.rosterCount += 1;
    map.set(enrollment.schoolClass.id, current);
    return map;
  }, new Map());

  attendanceRecords.forEach((record) => {
    const current = rosterCounts.get(record.schoolClass.id) || {
      classId: record.schoolClass.id,
      classLabel: getClassLabel(record.schoolClass),
      rosterCount: 0,
      markedCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      presentCount: 0,
    };

    current.markedCount += 1;

    if (record.status === "PRESENT") {
      current.presentCount += 1;
    }

    if (record.status === "ABSENT") {
      current.absentCount += 1;
    }

    if (record.status === "LATE") {
      current.lateCount += 1;
    }

    if (record.status === "EXCUSED") {
      current.excusedCount += 1;
    }

    rosterCounts.set(record.schoolClass.id, current);
  });

  return Array.from(rosterCounts.values())
    .map((classSummary) => {
      const attended = classSummary.presentCount + classSummary.lateCount + classSummary.excusedCount;
      const attendanceRate = classSummary.markedCount
        ? roundNumber((attended / classSummary.markedCount) * 100)
        : 0;

      return {
        classId: classSummary.classId,
        classLabel: classSummary.classLabel,
        attendanceRate,
        markedCount: classSummary.markedCount,
        absentCount: classSummary.absentCount,
        rosterCount: classSummary.rosterCount,
      };
    })
    .sort((left, right) => right.attendanceRate - left.attendanceRate);
}

function buildAssessmentRows(assessments) {
  return assessments.map((assessment) => {
    const validMarks = assessment.grades
      .map((grade) => (grade.marks === null ? null : Number(grade.marks)))
      .filter((marks) => marks !== null);
    const averageMarks = validMarks.length
      ? roundNumber(validMarks.reduce((sum, marks) => sum + marks, 0) / validMarks.length)
      : 0;

    return {
      id: assessment.id,
      title: assessment.title,
      subjectName: assessment.subject.name,
      subjectCode: assessment.subject.code,
      classLabel: getClassLabel(assessment.schoolClass),
      status: assessment.status,
      dueDate: assessment.dueDate,
      gradedEntries: validMarks.length,
      rosterCount: assessment._count.grades,
      averageMarks,
      assignedBy: assessment.assignedBy
        ? `${assessment.assignedBy.user.firstName} ${assessment.assignedBy.user.lastName}`
        : "Not assigned",
    };
  });
}

function buildAssessmentStatusData(assessmentRows) {
  const counts = assessmentRows.reduce((map, row) => {
    const current = map.get(row.status) || {
      status: row.status,
      count: 0,
    };

    current.count += 1;
    map.set(row.status, current);
    return map;
  }, new Map());

  return Array.from(counts.values());
}

function buildTeacherRows(teachers) {
  return teachers.map((teacher) => ({
    teacherId: teacher.id,
    fullName: `${teacher.user.firstName} ${teacher.user.lastName}`,
    employeeCode: teacher.employeeCode,
    classesOwned: teacher.homeroomClasses.length,
    subjectAssignments: teacher.subjectAssignments.length,
    attendanceEntries: teacher.attendanceRecords.length,
    assessmentsCreated: teacher.assessments.length,
  }));
}

export async function getReportsOverview({ userId, role, filters }) {
  const scope = await getAccessibleScope({ userId, role, filters });
  const attendanceWhere = buildAttendanceWhere(scope);
  const assessmentWhere = buildAssessmentWhere(scope);

  const [enrollments, attendanceRecords, assessments, teachers] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        academicYearId: scope.academicYear.id,
        status: "ACTIVE",
        ...(scope.schoolClassId
          ? { schoolClassId: scope.schoolClassId }
          : scope.role === "TEACHER"
            ? { schoolClassId: { in: scope.accessibleClassIds } }
            : {}),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        schoolClass: true,
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: attendanceWhere,
      include: {
        schoolClass: true,
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ date: "desc" }],
    }),
    prisma.assessment.findMany({
      where: assessmentWhere,
      include: {
        subject: true,
        schoolClass: true,
        assignedBy: {
          include: {
            user: true,
          },
        },
        grades: {
          select: {
            marks: true,
          },
        },
        _count: {
          select: {
            grades: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.teacher.findMany({
      where:
        scope.role === "TEACHER"
          ? { id: scope.teacherId }
          : undefined,
      include: {
        user: true,
        homeroomClasses: {
          where:
            scope.role === "TEACHER"
              ? undefined
              : scope.schoolClassId
                ? { id: scope.schoolClassId }
                : undefined,
        },
        subjectAssignments: {
          where: {
            ...(scope.schoolClassId ? { schoolClassId: scope.schoolClassId } : {}),
            ...(scope.subjectId ? { subjectId: scope.subjectId } : {}),
          },
        },
        attendanceRecords: {
          where: attendanceWhere,
        },
        assessments: {
          where: assessmentWhere,
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const attendanceRows = buildAttendanceRows(enrollments, attendanceRecords);
  const attendanceByClass = buildAttendanceByClass(enrollments, attendanceRecords);
  const assessmentRows = buildAssessmentRows(assessments);
  const teacherRows = buildTeacherRows(teachers);

  const markedEntries = attendanceRecords.length;
  const attendedEntries = attendanceRecords.filter((record) => record.status !== "ABSENT").length;
  const attendanceRate = markedEntries ? roundNumber((attendedEntries / markedEntries) * 100) : 0;
  const absentCount = attendanceRecords.filter((record) => record.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((record) => record.status === "LATE").length;
  const draftAssessments = assessmentRows.filter((assessment) => assessment.status === "DRAFT").length;
  const publishedAssessments = assessmentRows.filter((assessment) => assessment.status === "PUBLISHED").length;
  const averageMarks = assessmentRows.length
    ? roundNumber(
        assessmentRows.reduce((sum, assessment) => sum + assessment.averageMarks, 0) /
          assessmentRows.length,
      )
    : 0;

  return {
    scope: scope.role,
    filters: {
      academicYear: {
        id: scope.academicYear.id,
        name: scope.academicYear.name,
      },
      term: scope.term
        ? {
            id: scope.term.id,
            name: scope.term.name,
          }
        : null,
      schoolClassId: scope.schoolClassId,
      subjectId: scope.subjectId,
      dateFrom: scope.dateFrom ? scope.dateFrom.toISOString().slice(0, 10) : null,
      dateTo: scope.dateTo ? scope.dateTo.toISOString().slice(0, 10) : null,
    },
    summary: {
      totalStudents: enrollments.length,
      attendanceRate,
      markedEntries,
      absentCount,
      lateCount,
      draftAssessments,
      publishedAssessments,
      averageMarks,
      teacherRowsCount: teacherRows.length,
    },
    attendanceByClass,
    assessmentStatus: buildAssessmentStatusData(assessmentRows),
    attendanceRows,
    assessmentRows,
    teacherRows,
  };
}
