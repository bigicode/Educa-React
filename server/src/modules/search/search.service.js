import { prisma } from "../../config/prisma.js";

const supportedRoles = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);
const announcementAudienceLabels = {
  ALL_SCHOOL: "All School",
  STAFF: "Staff",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
  PARENTS: "Parents",
};

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Class";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function buildStudentSubtitle(student) {
  const currentEnrollment = student.enrollments?.[0];
  const classLabel = currentEnrollment?.schoolClass ? getClassLabel(currentEnrollment.schoolClass) : "Unassigned class";
  const guardianLabel = student.guardianName ? `Guardian ${student.guardianName}` : "Guardian pending";

  return `${student.admissionNumber} - ${classLabel} - ${guardianLabel}`;
}

function buildTeacherSubtitle(teacher) {
  const qualification = teacher.qualification || "Qualification not recorded";
  return `${teacher.employeeCode} - ${qualification}`;
}

function buildAssessmentSubtitle(assessment) {
  return `${assessment.subject.name} - ${getClassLabel(assessment.schoolClass)} - ${assessment.status}`;
}

function getAnnouncementDelegate() {
  return prisma.announcement || null;
}

async function getActiveAcademicYear() {
  return (
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }))
  );
}

async function getTeacherContext(userId) {
  const teacher = await prisma.teacher.findFirst({
    where: { userId },
    include: {
      homeroomClasses: {
        select: {
          id: true,
        },
      },
      subjectAssignments: {
        select: {
          schoolClassId: true,
        },
      },
    },
  });

  const accessibleClassIds = Array.from(
    new Set([
      ...(teacher?.homeroomClasses?.map((schoolClass) => schoolClass.id) || []),
      ...(teacher?.subjectAssignments?.map((assignment) => assignment.schoolClassId).filter(Boolean) || []),
    ]),
  );

  return {
    teacherId: teacher?.id || null,
    accessibleClassIds,
  };
}

function createResult({ id, title, subtitle, category, route }) {
  return {
    id,
    title,
    subtitle,
    category,
    route,
  };
}

export async function searchGlobalEntities({ userId, role, query }) {
  if (!supportedRoles.has(role)) {
    return [];
  }

  const activeAcademicYear = await getActiveAcademicYear();
  const teacherContext = role === "TEACHER" ? await getTeacherContext(userId) : null;
  const accessibleClassIds = role === "TEACHER" ? teacherContext?.accessibleClassIds || [] : null;
  const teacherId = role === "TEACHER" ? teacherContext?.teacherId || null : null;
  const normalizedQuery = query.trim();
  const announcementDelegate = getAnnouncementDelegate();
  const teacherAssessmentScope =
    role === "TEACHER"
      ? {
          ...(teacherId || accessibleClassIds?.length
            ? {
                AND: [
                  {
                    OR: [
                      ...(teacherId ? [{ assignedById: teacherId }] : []),
                      ...(accessibleClassIds?.length ? [{ schoolClassId: { in: accessibleClassIds } }] : []),
                    ],
                  },
                ],
              }
            : { AND: [{ id: "__no_teacher_scope__" }] }),
        }
      : {};

  const [students, teachers, subjects, classes, assessments, announcements] = await Promise.all([
    prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: normalizedQuery } },
          { lastName: { contains: normalizedQuery } },
          { admissionNumber: { contains: normalizedQuery } },
          { guardianName: { contains: normalizedQuery } },
          { email: { contains: normalizedQuery } },
        ],
        ...(activeAcademicYear?.id
          ? {
              enrollments: {
                some: {
                  academicYearId: activeAcademicYear.id,
                  ...(accessibleClassIds ? { schoolClassId: { in: accessibleClassIds } } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        enrollments: {
          where: activeAcademicYear?.id
            ? {
                academicYearId: activeAcademicYear.id,
                ...(accessibleClassIds ? { schoolClassId: { in: accessibleClassIds } } : {}),
              }
            : undefined,
          orderBy: [{ updatedAt: "desc" }],
          take: 1,
          include: {
            schoolClass: {
              select: {
                name: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 4,
    }),
    prisma.teacher.findMany({
      where: {
        OR: [
          { employeeCode: { contains: normalizedQuery } },
          { qualification: { contains: normalizedQuery } },
          { user: { firstName: { contains: normalizedQuery } } },
          { user: { lastName: { contains: normalizedQuery } } },
          { user: { email: { contains: normalizedQuery } } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 3,
    }),
    prisma.subject.findMany({
      where: {
        OR: [{ name: { contains: normalizedQuery } }, { code: { contains: normalizedQuery } }],
      },
      orderBy: [{ name: "asc" }],
      take: 3,
    }),
    prisma.schoolClass.findMany({
      where: {
        OR: [
          { name: { contains: normalizedQuery } },
          { level: { contains: normalizedQuery } },
          { section: { contains: normalizedQuery } },
        ],
        ...(accessibleClassIds ? { id: { in: accessibleClassIds } } : {}),
      },
      orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
      take: 3,
    }),
    prisma.assessment.findMany({
      where: {
        OR: [
          { title: { contains: normalizedQuery } },
          { status: { contains: normalizedQuery } },
          { subject: { name: { contains: normalizedQuery } } },
          { schoolClass: { name: { contains: normalizedQuery } } },
          { schoolClass: { section: { contains: normalizedQuery } } },
        ],
        ...(activeAcademicYear?.id ? { academicYearId: activeAcademicYear.id } : {}),
        ...teacherAssessmentScope,
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        schoolClass: {
          select: {
            name: true,
            section: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 4,
    }),
    announcementDelegate
      ? announcementDelegate.findMany({
          where: {
            ...(role === "TEACHER"
              ? {
                  OR: [{ status: "PUBLISHED" }, { createdById: userId }],
                }
              : {}),
            AND: [
              {
                OR: [
                  { title: { contains: normalizedQuery } },
                  { body: { contains: normalizedQuery } },
                  { audience: { equals: normalizedQuery.replace(/\s+/g, "_").toUpperCase() } },
                ],
              },
            ],
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const results = [
    ...students.map((student) =>
      createResult({
        id: `student-${student.id}`,
        title: `${student.firstName} ${student.lastName}`,
        subtitle: buildStudentSubtitle(student),
        category: "Student",
        route: "/dashboard/students",
      }),
    ),
    ...teachers.map((teacher) =>
      createResult({
        id: `teacher-${teacher.id}`,
        title: `${teacher.user.firstName} ${teacher.user.lastName}`,
        subtitle: buildTeacherSubtitle(teacher),
        category: "Teacher",
        route: "/dashboard/teachers",
      }),
    ),
    ...subjects.map((subject) =>
      createResult({
        id: `subject-${subject.id}`,
        title: subject.name,
        subtitle: `${subject.code} - Subject configuration`,
        category: "Subject",
        route: "/dashboard/academics",
      }),
    ),
    ...classes.map((schoolClass) =>
      createResult({
        id: `class-${schoolClass.id}`,
        title: getClassLabel(schoolClass),
        subtitle: `${schoolClass.level} - Class setup and timetables`,
        category: "Class",
        route: "/dashboard/academics",
      }),
    ),
    ...assessments.map((assessment) =>
      createResult({
        id: `assessment-${assessment.id}`,
        title: assessment.title,
        subtitle: buildAssessmentSubtitle(assessment),
        category: "Assessment",
        route: "/dashboard/assessments",
      }),
    ),
    ...announcements.map((announcement) =>
      createResult({
        id: `announcement-${announcement.id}`,
        title: announcement.title,
        subtitle: `${announcementAudienceLabels[announcement.audience] || announcement.audience} - ${
          announcement.status === "PUBLISHED" ? "Published notice" : "Draft notice"
        }`,
        category: "Announcement",
        route: "/dashboard/communication",
      }),
    ),
  ];

  return results.slice(0, 12);
}
