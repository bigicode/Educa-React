import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

function formatStudent(student) {
  const currentEnrollment =
    student.enrollments.find((enrollment) => enrollment.status === "ACTIVE") || student.enrollments[0] || null;

  return {
    id: student.id,
    admissionNumber: student.admissionNumber,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    fullName: `${student.user.firstName} ${student.user.lastName}`,
    email: student.user.email,
    role: student.user.role,
    isActive: student.user.isActive,
    dateOfBirth: student.dateOfBirth,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    currentEnrollment: currentEnrollment
      ? {
          id: currentEnrollment.id,
          status: currentEnrollment.status,
          academicYear: currentEnrollment.academicYear.name,
          schoolClass: {
            id: currentEnrollment.schoolClass.id,
            name: currentEnrollment.schoolClass.name,
            level: currentEnrollment.schoolClass.level,
            section: currentEnrollment.schoolClass.section,
          },
        }
      : null,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

export async function listStudents(filters) {
  const { search, status, schoolClassId, academicYearId } = filters;
  const normalizedSearch = search?.trim();

  const students = await prisma.student.findMany({
    where: {
      ...(normalizedSearch
        ? {
            OR: [
              { admissionNumber: { contains: normalizedSearch } },
              { guardianName: { contains: normalizedSearch } },
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
          }
        : {}),
      ...(status || schoolClassId || academicYearId
        ? {
            enrollments: {
              some: {
                ...(status ? { status } : {}),
                ...(schoolClassId ? { schoolClassId } : {}),
                ...(academicYearId ? { academicYearId } : {}),
              },
            },
          }
        : {}),
    },
    include: {
      user: true,
      enrollments: {
        include: {
          schoolClass: true,
          academicYear: true,
        },
        orderBy: [{ createdAt: "desc" }],
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return students.map(formatStudent);
}

export async function getStudentById(studentId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      enrollments: {
        include: {
          schoolClass: true,
          academicYear: true,
        },
        orderBy: [{ createdAt: "desc" }],
      },
      attendance: {
        take: 10,
        orderBy: [{ date: "desc" }],
      },
      grades: {
        take: 10,
        orderBy: [{ createdAt: "desc" }],
        include: {
          assessment: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError("Student not found.", 404);
  }

  return {
    ...formatStudent(student),
    recentAttendance: student.attendance,
    recentGrades: student.grades.map((grade) => ({
      id: grade.id,
      marks: grade.marks,
      remarks: grade.remarks,
      assessment: {
        id: grade.assessment.id,
        title: grade.assessment.title,
        type: grade.assessment.type,
        subject: grade.assessment.subject.name,
      },
    })),
  };
}

export async function getStudentOptions() {
  const [classes, academicYears] = await Promise.all([
    prisma.schoolClass.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
      },
    }),
    prisma.academicYear.findMany({
      orderBy: [{ startDate: "desc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  return {
    classes,
    academicYears,
  };
}

export async function createStudent(data) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("A user with this email already exists.", 409);
  }

  const existingStudent = await prisma.student.findUnique({
    where: { admissionNumber: data.admissionNumber },
    select: { id: true },
  });

  if (existingStudent) {
    throw new AppError("Admission number already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const student = await prisma.$transaction(async (tx) => {
    if (data.schoolClassId) {
      const [schoolClass, academicYear] = await Promise.all([
        tx.schoolClass.findUnique({ where: { id: data.schoolClassId }, select: { id: true } }),
        tx.academicYear.findUnique({ where: { id: data.academicYearId }, select: { id: true } }),
      ]);

      if (!schoolClass || !academicYear) {
        throw new AppError("Selected class or academic year does not exist.", 400);
      }
    }

    const user = await tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: "STUDENT",
      },
    });

    const createdStudent = await tx.student.create({
      data: {
        userId: user.id,
        admissionNumber: data.admissionNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        ...(data.schoolClassId && data.academicYearId
          ? {
              enrollments: {
                create: {
                  schoolClassId: data.schoolClassId,
                  academicYearId: data.academicYearId,
                  status: data.enrollmentStatus,
                },
              },
            }
          : {}),
      },
      include: {
        user: true,
        enrollments: {
          include: {
            schoolClass: true,
            academicYear: true,
          },
        },
      },
    });

    return createdStudent;
  });

  return formatStudent(student);
}
