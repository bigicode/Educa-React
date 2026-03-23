import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { createAssessment as createAcademicAssessment, getAcademicsMeta } from "../academics/academics.service.js";

function formatClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Not assigned";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function formatTeacherName(teacher) {
  if (!teacher?.user) {
    return "Academic Office";
  }

  return `${teacher.user.firstName} ${teacher.user.lastName}`;
}

function getAssessmentIncludeConfig() {
  return {
    subject: true,
    schoolClass: true,
    academicYear: true,
    term: true,
    assignedBy: {
      include: {
        user: true,
      },
    },
    grades: {
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    },
  };
}

function formatAssessmentSummary(assessment, rosterCount) {
  const gradeCount = assessment.grades.length;
  const numericMarks = assessment.grades
    .map((grade) => (grade.marks === null || grade.marks === undefined ? null : Number(grade.marks)))
    .filter((value) => value !== null);
  const averageMarks = numericMarks.length
    ? Number((numericMarks.reduce((total, value) => total + value, 0) / numericMarks.length).toFixed(1))
    : null;
  const pendingCount = Math.max(rosterCount - gradeCount, 0);
  const completionRate = rosterCount ? Math.round((gradeCount / rosterCount) * 100) : 0;

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
    grading: {
      rosterCount,
      gradeCount,
      pendingCount,
      completionRate,
      averageMarks,
    },
  };
}

async function getRosterCounts(assessments) {
  if (!assessments.length) {
    return new Map();
  }

  const pairKeys = Array.from(
    new Set(assessments.map((assessment) => `${assessment.schoolClassId}:${assessment.academicYearId}`)),
  );
  const rosterPairs = pairKeys.map((key) => {
    const [schoolClassId, academicYearId] = key.split(":");
    return { schoolClassId, academicYearId };
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      OR: rosterPairs,
    },
    select: {
      schoolClassId: true,
      academicYearId: true,
      studentId: true,
    },
  });

  return enrollments.reduce((counts, enrollment) => {
    const key = `${enrollment.schoolClassId}:${enrollment.academicYearId}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

export async function listAssessments(filters) {
  const { search, status, type, subjectId, schoolClassId } = filters;
  const normalizedSearch = search?.trim();

  const assessments = await prisma.assessment.findMany({
    where: {
      ...(normalizedSearch
        ? {
            OR: [
              { title: { contains: normalizedSearch } },
              { subject: { name: { contains: normalizedSearch } } },
              { subject: { code: { contains: normalizedSearch } } },
              { schoolClass: { name: { contains: normalizedSearch } } },
              { schoolClass: { level: { contains: normalizedSearch } } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(schoolClassId ? { schoolClassId } : {}),
    },
    include: getAssessmentIncludeConfig(),
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const rosterCounts = await getRosterCounts(assessments);

  return assessments.map((assessment) =>
    formatAssessmentSummary(assessment, rosterCounts.get(`${assessment.schoolClassId}:${assessment.academicYearId}`) || 0),
  );
}

export async function getAssessmentById(assessmentId) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: getAssessmentIncludeConfig(),
  });

  if (!assessment) {
    throw new AppError("Assessment not found.", 404);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      schoolClassId: assessment.schoolClassId,
      academicYearId: assessment.academicYearId,
      status: "ACTIVE",
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  const gradeMap = new Map(
    assessment.grades.map((grade) => [
      grade.studentId,
      {
        id: grade.id,
        marks: grade.marks === null || grade.marks === undefined ? null : Number(grade.marks),
        remarks: grade.remarks,
        createdAt: grade.createdAt,
        updatedAt: grade.updatedAt,
      },
    ]),
  );

  const roster = enrollments
    .map((enrollment) => {
      const grade = gradeMap.get(enrollment.studentId) || null;

      return {
        student: {
          id: enrollment.student.id,
        admissionNumber: enrollment.student.admissionNumber,
        fullName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        },
        grade,
      };
    })
    .sort((left, right) => left.student.fullName.localeCompare(right.student.fullName));

  const summary = formatAssessmentSummary(assessment, roster.length);

  return {
    ...summary,
    roster,
  };
}

export async function getAssessmentOptions() {
  const meta = await getAcademicsMeta();

  return {
    ...meta,
    assessmentStatuses: ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "PUBLISHED"],
    assessmentTypes: ["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT"],
  };
}

export async function createAssessment(data) {
  return createAcademicAssessment(data);
}

export async function updateAssessmentStatus(assessmentId, status) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true },
  });

  if (!assessment) {
    throw new AppError("Assessment not found.", 404);
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status },
  });

  return getAssessmentById(assessmentId);
}

export async function upsertAssessmentGrades(assessmentId, gradeEntries) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      schoolClassId: true,
      academicYearId: true,
      totalMarks: true,
    },
  });

  if (!assessment) {
    throw new AppError("Assessment not found.", 404);
  }

  const validEnrollmentIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: {
          schoolClassId: assessment.schoolClassId,
          academicYearId: assessment.academicYearId,
          status: "ACTIVE",
          studentId: {
            in: gradeEntries.map((entry) => entry.studentId),
          },
        },
        select: {
          studentId: true,
        },
      })
    ).map((enrollment) => enrollment.studentId),
  );

  const invalidEntry = gradeEntries.find((entry) => !validEnrollmentIds.has(entry.studentId));

  if (invalidEntry) {
    throw new AppError("One or more grade entries do not belong to the assessment roster.", 400);
  }

  const outOfRangeEntry = gradeEntries.find(
    (entry) => entry.marks !== null && entry.marks !== undefined && entry.marks > assessment.totalMarks,
  );

  if (outOfRangeEntry) {
    throw new AppError(`Marks cannot exceed the assessment total of ${assessment.totalMarks}.`, 400);
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of gradeEntries) {
      const marks = entry.marks === null || entry.marks === undefined ? null : entry.marks;
      const remarks = entry.remarks?.trim() || null;

      if (marks === null && !remarks) {
        await tx.gradeEntry.deleteMany({
          where: {
            assessmentId,
            studentId: entry.studentId,
          },
        });
        continue;
      }

      await tx.gradeEntry.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId,
            studentId: entry.studentId,
          },
        },
        update: {
          marks,
          remarks,
        },
        create: {
          assessmentId,
          studentId: entry.studentId,
          marks,
          remarks,
        },
      });
    }
  });

  return getAssessmentById(assessmentId);
}
