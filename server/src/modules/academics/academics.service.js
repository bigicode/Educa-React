import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

function formatClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Not assigned";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function formatTeacherName(teacher) {
  if (!teacher?.user) {
    return "Not assigned";
  }

  return `${teacher.user.firstName} ${teacher.user.lastName}`;
}

function formatSubjectDirectoryEntry(subject) {
  const mappedClasses = subject.classMappings.map((mapping) => ({
    id: mapping.schoolClass.id,
    label: formatClassLabel(mapping.schoolClass),
  }));

  const teacherOwners = Array.from(
    new Map(
      subject.teacherAssignments.map((assignment) => [
        assignment.teacher.id,
        {
          id: assignment.teacher.id,
          name: formatTeacherName(assignment.teacher),
        },
      ]),
    ).values(),
  );

  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
    mappedClasses,
    teacherOwners,
    classMappingsCount: mappedClasses.length,
    teacherAssignmentsCount: teacherOwners.length,
    assessmentCount: subject.assessments.length,
    createdAt: subject.createdAt,
  };
}

function formatClassDirectoryEntry(schoolClass) {
  const subjectEntries = schoolClass.subjects.map((mapping) => ({
    id: mapping.subject.id,
    name: mapping.subject.name,
    code: mapping.subject.code,
  }));

  return {
    id: schoolClass.id,
    name: schoolClass.name,
    level: schoolClass.level,
    section: schoolClass.section,
    label: formatClassLabel(schoolClass),
    homeroomTeacher: schoolClass.classTeacher
      ? {
          id: schoolClass.classTeacher.id,
          fullName: formatTeacherName(schoolClass.classTeacher),
        }
      : null,
    subjectCount: subjectEntries.length,
    studentCount: schoolClass.enrollments.length,
    subjects: subjectEntries,
  };
}

function formatAssessmentEntry(assessment) {
  return {
    id: assessment.id,
    title: assessment.title,
    type: assessment.type,
    status: assessment.status,
    totalMarks: assessment.totalMarks,
    dueDate: assessment.dueDate,
    createdAt: assessment.createdAt,
    subject: {
      id: assessment.subject.id,
      name: assessment.subject.name,
      code: assessment.subject.code,
    },
    schoolClass: {
      id: assessment.schoolClass.id,
      label: formatClassLabel(assessment.schoolClass),
    },
    academicYear: {
      id: assessment.academicYear.id,
      name: assessment.academicYear.name,
    },
    term: assessment.term
      ? {
          id: assessment.term.id,
          name: assessment.term.name,
        }
      : null,
    assignedBy: assessment.assignedBy
      ? {
          id: assessment.assignedBy.id,
          fullName: formatTeacherName(assessment.assignedBy),
        }
      : null,
  };
}

export async function getAcademicsOverview() {
  const [academicYears, subjects, classes, assessments, totalMappings, totalAssessments] = await Promise.all([
    prisma.academicYear.findMany({
      include: {
        terms: {
          orderBy: [{ startDate: "asc" }],
        },
      },
      orderBy: [{ startDate: "desc" }],
    }),
    prisma.subject.findMany({
      include: {
        classMappings: {
          include: {
            schoolClass: true,
          },
        },
        teacherAssignments: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
        assessments: true,
      },
      orderBy: [{ name: "asc" }],
    }),
    prisma.schoolClass.findMany({
      include: {
        classTeacher: {
          include: {
            user: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
    }),
    prisma.assessment.findMany({
      include: {
        subject: true,
        schoolClass: true,
        academicYear: true,
        term: true,
        assignedBy: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
    }),
    prisma.classSubject.count(),
    prisma.assessment.count({
      where: {
        status: {
          in: ["DRAFT", "SCHEDULED", "OPEN", "PUBLISHED"],
        },
      },
    }),
  ]);

  const activeAcademicYear = academicYears.find((year) => year.isActive) || academicYears[0] || null;
  const subjectDirectory = subjects.map(formatSubjectDirectoryEntry);
  const classDirectory = classes.map(formatClassDirectoryEntry);
  const assessmentPipeline = assessments.map(formatAssessmentEntry);

  const coverageGaps = [
    ...classDirectory
      .filter((schoolClass) => schoolClass.subjectCount === 0)
      .map((schoolClass) => ({
        id: `class-${schoolClass.id}`,
        type: "CLASS_MAPPING",
        title: schoolClass.label,
        description: "This class does not have any subjects mapped yet.",
        schoolClassId: schoolClass.id,
        subjectId: null,
        actionLabel: "Map subject",
      })),
    ...subjectDirectory
      .filter((subject) => subject.classMappingsCount === 0)
      .map((subject) => ({
        id: `subject-${subject.id}`,
        type: "SUBJECT_MAPPING",
        title: `${subject.name} (${subject.code})`,
        description: "This subject has not been mapped to any class yet.",
        schoolClassId: null,
        subjectId: subject.id,
        actionLabel: "Map class",
      })),
    ...subjectDirectory
      .filter((subject) => subject.teacherAssignmentsCount === 0)
      .map((subject) => ({
        id: `teacher-${subject.id}`,
        type: "TEACHER_OWNERSHIP",
        title: `${subject.name} (${subject.code})`,
        description: "No teacher allocation has been linked to this subject yet.",
        schoolClassId: null,
        subjectId: subject.id,
        actionLabel: "Review teachers",
      })),
  ].slice(0, 6);

  return {
    activeAcademicYear: activeAcademicYear
      ? {
          id: activeAcademicYear.id,
          name: activeAcademicYear.name,
          startDate: activeAcademicYear.startDate,
          endDate: activeAcademicYear.endDate,
          isActive: activeAcademicYear.isActive,
          terms: activeAcademicYear.terms.map((term) => ({
            id: term.id,
            name: term.name,
            startDate: term.startDate,
            endDate: term.endDate,
            isActive: term.isActive,
          })),
        }
      : null,
    summary: {
      totalClasses: classDirectory.length,
      totalSubjects: subjectDirectory.length,
      totalMappings,
      totalAssessments,
    },
    subjectDirectory,
    classDirectory,
    assessmentPipeline,
    coverageGaps,
  };
}

export async function getAcademicsMeta() {
  const [classes, subjects, teachers, academicYears] = await Promise.all([
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
    prisma.teacher.findMany({
      where: {
        user: {
          isActive: true,
        },
      },
      include: {
        user: true,
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.academicYear.findMany({
      include: {
        terms: {
          orderBy: [{ startDate: "asc" }],
        },
      },
      orderBy: [{ startDate: "desc" }],
    }),
  ]);

  return {
    classes: classes.map((schoolClass) => ({
      ...schoolClass,
      label: formatClassLabel(schoolClass),
    })),
    subjects,
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      employeeCode: teacher.employeeCode,
      fullName: formatTeacherName(teacher),
    })),
    academicYears: academicYears.map((year) => ({
      id: year.id,
      name: year.name,
      isActive: year.isActive,
      startDate: year.startDate,
      endDate: year.endDate,
      terms: year.terms.map((term) => ({
        id: term.id,
        name: term.name,
        academicYearId: term.academicYearId,
        startDate: term.startDate,
        endDate: term.endDate,
        isActive: term.isActive,
      })),
    })),
  };
}

export async function createSubject(data) {
  const existingSubject = await prisma.subject.findUnique({
    where: { code: data.code },
    select: { id: true },
  });

  if (existingSubject) {
    throw new AppError("Subject code already exists.", 409);
  }

  const subject = await prisma.subject.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description || null,
    },
  });

  return subject;
}

export async function createClassMapping(data) {
  const [schoolClass, subject] = await Promise.all([
    prisma.schoolClass.findUnique({
      where: { id: data.schoolClassId },
      select: { id: true, name: true, section: true },
    }),
    prisma.subject.findUnique({
      where: { id: data.subjectId },
      select: { id: true, name: true, code: true },
    }),
  ]);

  if (!schoolClass || !subject) {
    throw new AppError("Selected class or subject does not exist.", 400);
  }

  const existingMapping = await prisma.classSubject.findFirst({
    where: {
      schoolClassId: data.schoolClassId,
      subjectId: data.subjectId,
    },
    select: { id: true },
  });

  if (existingMapping) {
    throw new AppError("This subject is already mapped to the selected class.", 409);
  }

  const mapping = await prisma.classSubject.create({
    data: {
      schoolClassId: data.schoolClassId,
      subjectId: data.subjectId,
    },
    include: {
      schoolClass: true,
      subject: true,
    },
  });

  return {
    id: mapping.id,
    schoolClass: {
      id: mapping.schoolClass.id,
      label: formatClassLabel(mapping.schoolClass),
    },
    subject: {
      id: mapping.subject.id,
      name: mapping.subject.name,
      code: mapping.subject.code,
    },
  };
}

export async function createAssessment(data) {
  const [subject, schoolClass, academicYear, term, assignedBy, mapping] = await Promise.all([
    prisma.subject.findUnique({
      where: { id: data.subjectId },
      select: { id: true },
    }),
    prisma.schoolClass.findUnique({
      where: { id: data.schoolClassId },
      select: { id: true },
    }),
    prisma.academicYear.findUnique({
      where: { id: data.academicYearId },
      select: { id: true },
    }),
    data.termId
      ? prisma.term.findUnique({
          where: { id: data.termId },
          select: { id: true, academicYearId: true },
        })
      : Promise.resolve(null),
    data.assignedById
      ? prisma.teacher.findUnique({
          where: { id: data.assignedById },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.classSubject.findFirst({
      where: {
        schoolClassId: data.schoolClassId,
        subjectId: data.subjectId,
      },
      select: { id: true },
    }),
  ]);

  if (!subject || !schoolClass || !academicYear) {
    throw new AppError("Selected subject, class, or academic year does not exist.", 400);
  }

  if (data.termId && !term) {
    throw new AppError("Selected term does not exist.", 400);
  }

  if (term && term.academicYearId !== data.academicYearId) {
    throw new AppError("Selected term does not belong to the chosen academic year.", 400);
  }

  if (data.assignedById && !assignedBy) {
    throw new AppError("Selected teacher owner does not exist.", 400);
  }

  if (!mapping) {
    throw new AppError("Map the subject to the selected class before scheduling an assessment.", 409);
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: data.title,
      type: data.type,
      status: data.status,
      subjectId: data.subjectId,
      schoolClassId: data.schoolClassId,
      academicYearId: data.academicYearId,
      termId: data.termId || null,
      assignedById: data.assignedById || null,
      totalMarks: data.totalMarks,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      subject: true,
      schoolClass: true,
      academicYear: true,
      term: true,
      assignedBy: {
        include: {
          user: true,
        },
      },
    },
  });

  return formatAssessmentEntry(assessment);
}
