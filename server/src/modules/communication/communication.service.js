import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const announcementManagers = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);
const audienceLabels = {
  ALL_SCHOOL: "All School",
  STAFF: "Staff",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
  PARENTS: "Parents",
};

function getAnnouncementDelegate() {
  if (!prisma.announcement) {
    throw new AppError(
      "Communication storage is not ready yet. Run `npm run prisma:generate`, restart the server, and import the updated `saved.sql` Announcement table into XAMPP.",
      503,
    );
  }

  return prisma.announcement;
}

function formatLongDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function formatAnnouncement(announcement) {
  return {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    audienceLabel: audienceLabels[announcement.audience] || announcement.audience,
    status: announcement.status,
    publishedAt: announcement.publishedAt,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
    createdBy: {
      id: announcement.createdBy.id,
      name: `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`,
      role: announcement.createdBy.role,
    },
  };
}

function buildAnnouncementWhere({ role, userId, filters }) {
  const search = filters.search?.trim();
  const baseVisibility =
    role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN"
      ? {}
      : role === "TEACHER"
        ? {
            OR: [{ status: "PUBLISHED" }, { createdById: userId }],
          }
        : {
            status: "PUBLISHED",
          };

  const where = {
    ...baseVisibility,
  };

  if (filters.audience) {
    where.audience = filters.audience;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (search) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [{ title: { contains: search } }, { body: { contains: search } }],
      },
    ];
  }

  return where;
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

  const ownedClassIds = Array.from(
    new Set([
      ...(teacher?.homeroomClasses?.map((schoolClass) => schoolClass.id) || []),
      ...(teacher?.subjectAssignments?.map((assignment) => assignment.schoolClassId).filter(Boolean) || []),
    ]),
  );

  return {
    teacher,
    ownedClassIds,
  };
}

async function buildActivityFeed({ role, userId }) {
  const announcementDelegate = getAnnouncementDelegate();
  const activeAcademicYear =
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }));

  const recentAnnouncementsPromise = announcementDelegate.findMany({
    where:
      role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN"
        ? {}
        : role === "TEACHER"
          ? {
              OR: [{ status: "PUBLISHED" }, { createdById: userId }],
            }
          : { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 4,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  if (role === "TEACHER") {
    const { teacher, ownedClassIds } = await getTeacherContext(userId);

    const [recentAnnouncements, latestAttendanceDate, recentAssessments] = await Promise.all([
      recentAnnouncementsPromise,
      ownedClassIds.length
        ? prisma.attendanceRecord.findFirst({
            where: {
              ...(activeAcademicYear?.id ? { academicYearId: activeAcademicYear.id } : {}),
              schoolClassId: { in: ownedClassIds },
            },
            orderBy: { date: "desc" },
            select: { date: true },
          })
        : Promise.resolve(null),
      teacher
        ? prisma.assessment.findMany({
            where: {
              ...(activeAcademicYear?.id ? { academicYearId: activeAcademicYear.id } : {}),
              assignedById: teacher.id,
            },
            orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
            take: 4,
            include: {
              subject: { select: { name: true } },
              schoolClass: { select: { name: true, section: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const items = recentAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: "ANNOUNCEMENT",
      title: announcement.title,
      body: `Announcement for ${audienceLabels[announcement.audience] || announcement.audience}.`,
      time:
        announcement.publishedAt || announcement.createdAt
          ? formatLongDateLabel(announcement.publishedAt || announcement.createdAt)
          : "Today",
      tone: announcement.status === "PUBLISHED" ? "blue" : "cream",
    }));

    if (latestAttendanceDate?.date) {
      items.push({
        id: `attendance-${latestAttendanceDate.date.toISOString()}`,
        type: "ATTENDANCE",
        title: "Latest class attendance synced",
        body: `Your class attendance register was updated for ${formatLongDateLabel(latestAttendanceDate.date)}.`,
        time: formatLongDateLabel(latestAttendanceDate.date),
        tone: "blue",
      });
    }

    recentAssessments.forEach((assessment) => {
      items.push({
        id: `assessment-${assessment.id}`,
        type: "ASSESSMENT",
        title: assessment.title,
        body: `${assessment.subject.name} for ${assessment.schoolClass.section ? `${assessment.schoolClass.name} ${assessment.schoolClass.section}` : assessment.schoolClass.name} is ${assessment.status.toLowerCase()}.`,
        time: assessment.dueDate ? formatLongDateLabel(assessment.dueDate) : "Assessment workflow",
        tone: assessment.status === "DRAFT" ? "cream" : "blue",
      });
    });

    return items.slice(0, 8);
  }

  const [recentAnnouncements, latestAttendanceDate, recentAssessments] = await Promise.all([
    recentAnnouncementsPromise,
    prisma.attendanceRecord.findFirst({
      where: activeAcademicYear?.id ? { academicYearId: activeAcademicYear.id } : undefined,
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.assessment.findMany({
      where: activeAcademicYear?.id ? { academicYearId: activeAcademicYear.id } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 4,
      include: {
        subject: { select: { name: true } },
        schoolClass: { select: { name: true, section: true } },
      },
    }),
  ]);

  const items = recentAnnouncements.map((announcement) => ({
    id: `announcement-${announcement.id}`,
    type: "ANNOUNCEMENT",
    title: announcement.title,
    body: `Announcement for ${audienceLabels[announcement.audience] || announcement.audience}.`,
    time:
      announcement.publishedAt || announcement.createdAt
        ? formatLongDateLabel(announcement.publishedAt || announcement.createdAt)
        : "Today",
    tone: announcement.status === "PUBLISHED" ? "blue" : "cream",
  }));

  if (latestAttendanceDate?.date) {
    items.push({
      id: `attendance-${latestAttendanceDate.date.toISOString()}`,
      type: "ATTENDANCE",
      title: "Attendance summary available",
      body: `The latest school attendance summary is ready for ${formatLongDateLabel(latestAttendanceDate.date)}.`,
      time: formatLongDateLabel(latestAttendanceDate.date),
      tone: "blue",
    });
  }

  recentAssessments.forEach((assessment) => {
    items.push({
      id: `assessment-${assessment.id}`,
      type: "ASSESSMENT",
      title: assessment.title,
      body: `${assessment.subject.name} for ${assessment.schoolClass.section ? `${assessment.schoolClass.name} ${assessment.schoolClass.section}` : assessment.schoolClass.name} is ${assessment.status.toLowerCase()}.`,
      time: assessment.dueDate ? formatLongDateLabel(assessment.dueDate) : "Assessment workflow",
      tone: assessment.status === "DRAFT" ? "cream" : "blue",
    });
  });

  return items.slice(0, 8);
}

function buildAudienceStats(announcements) {
  const grouped = announcements.reduce((stats, announcement) => {
    const current = stats.get(announcement.audience) || {
      audience: announcement.audience,
      audienceLabel: announcement.audienceLabel,
      total: 0,
      published: 0,
      draft: 0,
    };

    current.total += 1;
    current.published += announcement.status === "PUBLISHED" ? 1 : 0;
    current.draft += announcement.status === "DRAFT" ? 1 : 0;
    stats.set(announcement.audience, current);
    return stats;
  }, new Map());

  return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
}

export async function getCommunicationOverview({ userId, role, filters }) {
  const announcementDelegate = getAnnouncementDelegate();
  const baseWhere = buildAnnouncementWhere({ role, userId, filters: {} });
  const filteredWhere = buildAnnouncementWhere({ role, userId, filters });

  const [allVisibleAnnouncements, announcements, activityFeed] = await Promise.all([
    announcementDelegate.findMany({
      where: baseWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    announcementDelegate.findMany({
      where: filteredWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    buildActivityFeed({ role, userId }),
  ]);

  const normalizedAllAnnouncements = allVisibleAnnouncements.map(formatAnnouncement);
  const normalizedAnnouncements = announcements.map(formatAnnouncement);
  const publishedCount = normalizedAllAnnouncements.filter((announcement) => announcement.status === "PUBLISHED").length;
  const draftCount = normalizedAllAnnouncements.filter((announcement) => announcement.status === "DRAFT").length;
  const audienceStats = buildAudienceStats(normalizedAllAnnouncements);

  return {
    canManageAnnouncements: announcementManagers.has(role),
    summary: {
      totalAnnouncements: normalizedAllAnnouncements.length,
      publishedCount,
      draftCount,
      audienceCoverage: audienceStats.length,
      activityCount: activityFeed.length,
    },
    announcements: normalizedAnnouncements,
    activityFeed,
    audienceStats,
  };
}

function assertCanManageAnnouncements(role) {
  if (!announcementManagers.has(role)) {
    throw new AppError("You do not have permission to manage announcements.", 403);
  }
}

export async function createAnnouncement({ userId, role, data }) {
  assertCanManageAnnouncements(role);
  const announcementDelegate = getAnnouncementDelegate();

  const announcement = await announcementDelegate.create({
    data: {
      title: data.title,
      body: data.body,
      audience: data.audience,
      status: data.status,
      createdById: userId,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return formatAnnouncement(announcement);
}

export async function updateAnnouncement({ userId, role, announcementId, data }) {
  assertCanManageAnnouncements(role);
  const announcementDelegate = getAnnouncementDelegate();

  const existingAnnouncement = await announcementDelegate.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      createdById: true,
      status: true,
      publishedAt: true,
    },
  });

  if (!existingAnnouncement) {
    throw new AppError("Announcement not found.", 404);
  }

  if (role === "TEACHER" && existingAnnouncement.createdById !== userId) {
    throw new AppError("Teachers can only update announcements they created.", 403);
  }

  const nextStatus = data.status || existingAnnouncement.status;
  const announcement = await announcementDelegate.update({
    where: { id: announcementId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.audience !== undefined ? { audience: data.audience } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      publishedAt:
        nextStatus === "PUBLISHED"
          ? existingAnnouncement.publishedAt || new Date()
          : null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return formatAnnouncement(announcement);
}
