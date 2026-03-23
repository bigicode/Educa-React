import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

function formatSchoolClass(schoolClass) {
  if (!schoolClass) {
    return null;
  }

  return {
    id: schoolClass.id,
    name: schoolClass.name,
    level: schoolClass.level,
    section: schoolClass.section,
  };
}

function formatSubjectAssignment(assignment) {
  return {
    id: assignment.id,
    subject: {
      id: assignment.subject.id,
      name: assignment.subject.name,
      code: assignment.subject.code,
    },
    schoolClass: formatSchoolClass(assignment.schoolClass),
  };
}

function teacherIncludeConfig() {
  return {
    user: true,
    homeroomClasses: {
      orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
    },
    subjectAssignments: {
      include: {
        subject: true,
        schoolClass: true,
      },
      orderBy: [{ createdAt: "desc" }],
    },
  };
}

function formatTeacher(teacher) {
  const homeroomClasses = teacher.homeroomClasses.map(formatSchoolClass);
  const subjectAssignments = teacher.subjectAssignments.map(formatSubjectAssignment);
  const primaryHomeroomClass = homeroomClasses[0] || null;
  const primarySubjectAssignment = subjectAssignments[0] || null;

  return {
    id: teacher.id,
    employeeCode: teacher.employeeCode,
    firstName: teacher.user.firstName,
    lastName: teacher.user.lastName,
    fullName: `${teacher.user.firstName} ${teacher.user.lastName}`,
    email: teacher.user.email,
    role: teacher.user.role,
    isActive: teacher.user.isActive,
    phoneNumber: teacher.phoneNumber,
    qualification: teacher.qualification,
    homeroomClasses,
    primaryHomeroomClass,
    subjectAssignments,
    primarySubjectAssignment,
    allocationSummary: {
      subjectAssignmentsCount: subjectAssignments.length,
      classAssignmentsCount: subjectAssignments.filter((assignment) => assignment.schoolClass).length,
      homeroomClassCount: homeroomClasses.length,
    },
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}

async function validateTeacherRelationships(tx, { teacherId = null, homeroomClassId, subjectId, assignmentClassId }) {
  if (homeroomClassId) {
    const homeroomClass = await tx.schoolClass.findUnique({
      where: { id: homeroomClassId },
      select: { id: true, classTeacherId: true },
    });

    if (!homeroomClass) {
      throw new AppError("Selected homeroom class does not exist.", 400);
    }

    if (homeroomClass.classTeacherId && homeroomClass.classTeacherId !== teacherId) {
      throw new AppError("Selected homeroom class is already assigned to another teacher.", 409);
    }
  }

  if (subjectId) {
    const subject = await tx.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      throw new AppError("Selected subject does not exist.", 400);
    }
  }

  if (assignmentClassId) {
    const assignmentClass = await tx.schoolClass.findUnique({
      where: { id: assignmentClassId },
      select: { id: true },
    });

    if (!assignmentClass) {
      throw new AppError("Selected assignment class does not exist.", 400);
    }
  }
}

export async function listTeachers(filters) {
  const { search, status, subjectId, schoolClassId } = filters;
  const normalizedSearch = search?.trim();
  const whereClauses = [];

  if (normalizedSearch) {
    whereClauses.push({
      OR: [
        { employeeCode: { contains: normalizedSearch } },
        { phoneNumber: { contains: normalizedSearch } },
        { qualification: { contains: normalizedSearch } },
        {
          user: {
            OR: [
              { firstName: { contains: normalizedSearch } },
              { lastName: { contains: normalizedSearch } },
              { email: { contains: normalizedSearch } },
            ],
          },
        },
      ],
    });
  }

  if (status === "ACTIVE") {
    whereClauses.push({ user: { isActive: true } });
  }

  if (status === "INACTIVE") {
    whereClauses.push({ user: { isActive: false } });
  }

  if (subjectId) {
    whereClauses.push({
      subjectAssignments: {
        some: { subjectId },
      },
    });
  }

  if (schoolClassId) {
    whereClauses.push({
      OR: [
        {
          subjectAssignments: {
            some: { schoolClassId },
          },
        },
        {
          homeroomClasses: {
            some: { id: schoolClassId },
          },
        },
      ],
    });
  }

  const teachers = await prisma.teacher.findMany({
    where: whereClauses.length ? { AND: whereClauses } : undefined,
    include: teacherIncludeConfig(),
    orderBy: [{ createdAt: "desc" }],
  });

  return teachers.map(formatTeacher);
}

export async function getTeacherById(teacherId) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      ...teacherIncludeConfig(),
      assessments: {
        take: 10,
        orderBy: [{ createdAt: "desc" }],
        include: {
          subject: true,
          schoolClass: true,
          academicYear: true,
        },
      },
      attendanceRecords: {
        take: 10,
        orderBy: [{ date: "desc" }],
        include: {
          schoolClass: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    throw new AppError("Teacher not found.", 404);
  }

  return {
    ...formatTeacher(teacher),
    recentAssessments: teacher.assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      status: assessment.status,
      totalMarks: assessment.totalMarks,
      subject: {
        id: assessment.subject.id,
        name: assessment.subject.name,
        code: assessment.subject.code,
      },
      schoolClass: formatSchoolClass(assessment.schoolClass),
      academicYear: assessment.academicYear.name,
      dueDate: assessment.dueDate,
      createdAt: assessment.createdAt,
    })),
    recentAttendanceOwnership: teacher.attendanceRecords.map((entry) => ({
      id: entry.id,
      date: entry.date,
      status: entry.status,
      remarks: entry.remarks,
      schoolClass: formatSchoolClass(entry.schoolClass),
      student: {
        id: entry.student.id,
        fullName: `${entry.student.user.firstName} ${entry.student.user.lastName}`,
      },
    })),
  };
}

export async function getTeacherOptions() {
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
    classes,
    subjects,
  };
}

export async function createTeacher(data) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists.", 409);
  }

  const existingTeacher = await prisma.teacher.findUnique({
    where: { employeeCode: data.employeeCode },
    select: { id: true },
  });

  if (existingTeacher) {
    throw new AppError("Employee code already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    await validateTeacherRelationships(tx, {
      homeroomClassId: data.homeroomClassId,
      subjectId: data.subjectId,
      assignmentClassId: data.assignmentClassId,
    });

    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: "TEACHER",
      },
    });

    const createdTeacher = await tx.teacher.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        phoneNumber: data.phoneNumber || null,
        qualification: data.qualification || null,
        ...(data.subjectId
          ? {
              subjectAssignments: {
                create: {
                  subjectId: data.subjectId,
                  ...(data.assignmentClassId ? { schoolClassId: data.assignmentClassId } : {}),
                },
              },
            }
          : {}),
      },
      include: teacherIncludeConfig(),
    });

    if (data.homeroomClassId) {
      await tx.schoolClass.update({
        where: { id: data.homeroomClassId },
        data: {
          classTeacherId: createdTeacher.id,
        },
      });
    }

    return tx.teacher.findUnique({
      where: { id: createdTeacher.id },
      include: teacherIncludeConfig(),
    });
  });

  return formatTeacher(teacher);
}

export async function updateTeacher(teacherId, data) {
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: teacherIncludeConfig(),
  });

  if (!existingTeacher) {
    throw new AppError("Teacher not found.", 404);
  }

  if (data.email !== existingTeacher.user.email) {
    const emailOwner = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== existingTeacher.userId) {
      throw new AppError("A user with this email already exists.", 409);
    }
  }

  if (data.employeeCode !== existingTeacher.employeeCode) {
    const employeeCodeOwner = await prisma.teacher.findUnique({
      where: { employeeCode: data.employeeCode },
      select: { id: true },
    });

    if (employeeCodeOwner && employeeCodeOwner.id !== teacherId) {
      throw new AppError("Employee code already exists.", 409);
    }
  }

  const teacher = await prisma.$transaction(async (tx) => {
    await validateTeacherRelationships(tx, {
      teacherId,
      homeroomClassId: data.homeroomClassId,
      subjectId: data.subjectId,
      assignmentClassId: data.assignmentClassId,
    });

    await tx.user.update({
      where: { id: existingTeacher.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(data.accountStatus
          ? {
              isActive: data.accountStatus === "ACTIVE",
            }
          : {}),
      },
    });

    await tx.teacher.update({
      where: { id: teacherId },
      data: {
        employeeCode: data.employeeCode,
        phoneNumber: data.phoneNumber || null,
        qualification: data.qualification || null,
      },
    });

    await tx.schoolClass.updateMany({
      where: { classTeacherId: teacherId },
      data: { classTeacherId: null },
    });

    if (data.homeroomClassId) {
      await tx.schoolClass.update({
        where: { id: data.homeroomClassId },
        data: { classTeacherId: teacherId },
      });
    }

    await tx.teacherSubject.deleteMany({
      where: { teacherId },
    });

    if (data.subjectId) {
      await tx.teacherSubject.create({
        data: {
          teacherId,
          subjectId: data.subjectId,
          ...(data.assignmentClassId ? { schoolClassId: data.assignmentClassId } : {}),
        },
      });
    }

    return tx.teacher.findUnique({
      where: { id: teacherId },
      include: teacherIncludeConfig(),
    });
  });

  return formatTeacher(teacher);
}

export async function archiveTeacher(teacherId) {
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: teacherIncludeConfig(),
  });

  if (!existingTeacher) {
    throw new AppError("Teacher not found.", 404);
  }

  const teacher = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingTeacher.userId },
      data: { isActive: false },
    });

    return tx.teacher.findUnique({
      where: { id: teacherId },
      include: teacherIncludeConfig(),
    });
  });

  return formatTeacher(teacher);
}
