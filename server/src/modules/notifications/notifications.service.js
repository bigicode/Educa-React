import { prisma } from "../../config/prisma.js";

const supportedRoles = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);
const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const audienceLabels = {
  ALL_SCHOOL: "All School",
  STAFF: "Staff",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
  PARENTS: "Parents",
};

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function formatLongDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNamesShort[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatRelativeTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 0) {
    const futureMinutes = Math.abs(diffMinutes);

    if (futureMinutes < 60) {
      return "Soon";
    }

    const futureHours = Math.round(futureMinutes / 60);

    if (futureHours < 24) {
      return `In ${futureHours} hr`;
    }

    const futureDays = Math.round(futureHours / 24);
    return `In ${futureDays} day${futureDays === 1 ? "" : "s"}`;
  }

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  return formatLongDateLabel(date);
}

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Class";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function clipText(value, maxLength = 120) {
  if (!value) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function getAnnouncementDelegate() {
  return prisma.announcement || null;
}

async function getActiveAcademicYear() {
  return (
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        terms: {
          orderBy: { startDate: "asc" },
        },
      },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      include: {
        terms: {
          orderBy: { startDate: "asc" },
        },
      },
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
          name: true,
          section: true,
        },
      },
      subjectAssignments: {
        include: {
          schoolClass: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
        },
      },
    },
  });

  const accessibleClassMap = new Map();
  teacher?.homeroomClasses.forEach((schoolClass) => accessibleClassMap.set(schoolClass.id, schoolClass));
  teacher?.subjectAssignments.forEach((assignment) => {
    if (assignment.schoolClass) {
      accessibleClassMap.set(assignment.schoolClass.id, assignment.schoolClass);
    }
  });

  return {
    teacherId: teacher?.id || null,
    accessibleClassIds: Array.from(accessibleClassMap.keys()),
  };
}

async function buildMessages({ role, userId }) {
  const announcementDelegate = getAnnouncementDelegate();

  if (!announcementDelegate) {
    return [];
  }

  const announcements = await announcementDelegate.findMany({
    where:
      role === "TEACHER"
        ? {
            OR: [{ status: "PUBLISHED" }, { createdById: userId }],
          }
        : {},
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return announcements.map((announcement) => ({
    id: `announcement-${announcement.id}`,
    sender: `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`,
    subject: announcement.title,
    preview: clipText(announcement.body),
    time: formatRelativeTime(announcement.publishedAt || announcement.createdAt),
    route: "/dashboard/communication",
    kind: announcement.status === "PUBLISHED" ? audienceLabels[announcement.audience] || "Announcement" : "Draft",
    tone: announcement.status === "PUBLISHED" ? "blue" : "cream",
  }));
}

async function buildAttendanceNotifications({ academicYearId, accessibleClassIds }) {
  if (!academicYearId) {
    return [];
  }

  const latestAttendance = await prisma.attendanceRecord.findFirst({
    where: {
      academicYearId,
      ...(accessibleClassIds ? { schoolClassId: { in: accessibleClassIds } } : {}),
    },
    orderBy: { date: "desc" },
    select: {
      date: true,
    },
  });

  if (!latestAttendance?.date) {
    return [];
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      academicYearId,
      date: latestAttendance.date,
      ...(accessibleClassIds ? { schoolClassId: { in: accessibleClassIds } } : {}),
    },
    include: {
      schoolClass: {
        select: {
          id: true,
          name: true,
          section: true,
        },
      },
    },
  });

  const groupedByClass = records.reduce((groups, record) => {
    const current = groups.get(record.schoolClassId) || {
      schoolClassId: record.schoolClassId,
      schoolClass: record.schoolClass,
      markedCount: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
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

    groups.set(record.schoolClassId, current);
    return groups;
  }, new Map());

  return Array.from(groupedByClass.values())
    .map((classSummary) => {
      const attendedCount = classSummary.presentCount + classSummary.lateCount + classSummary.excusedCount;
      const attendanceRate = classSummary.markedCount
        ? Math.round((attendedCount / classSummary.markedCount) * 1000) / 10
        : 0;

      return {
        ...classSummary,
        attendanceRate,
      };
    })
    .filter((classSummary) => classSummary.attendanceRate < 92 || classSummary.absentCount > 0)
    .sort((left, right) => {
      if (left.attendanceRate !== right.attendanceRate) {
        return left.attendanceRate - right.attendanceRate;
      }

      return right.absentCount - left.absentCount;
    })
    .slice(0, 3)
    .map((classSummary) => ({
      id: `attendance-${classSummary.schoolClassId}-${toDateKey(latestAttendance.date)}`,
      title: `${getClassLabel(classSummary.schoolClass)} needs attendance follow-up`,
      detail: `${classSummary.absentCount} absent, ${classSummary.lateCount} late, ${classSummary.excusedCount} excused on ${formatLongDateLabel(
        latestAttendance.date,
      )}.`,
      time: formatRelativeTime(latestAttendance.date),
      tone:
        classSummary.attendanceRate < 85
          ? "rose"
          : classSummary.absentCount >= 3 || classSummary.lateCount >= 2
            ? "cream"
            : "blue",
      route: "/dashboard/attendance",
      category: "Attendance",
      priority: 1,
      sortDate: latestAttendance.date,
    }));
}

async function buildAssessmentNotifications({ academicYearId, accessibleClassIds, teacherId, role }) {
  if (!academicYearId) {
    return [];
  }

  if (role === "TEACHER" && !teacherId && !accessibleClassIds?.length) {
    return [];
  }

  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 14);

  const assessments = await prisma.assessment.findMany({
    where: {
      academicYearId,
      dueDate: {
        gte: today,
        lte: windowEnd,
      },
      ...(role === "TEACHER"
        ? {
            OR: [
              ...(teacherId ? [{ assignedById: teacherId }] : []),
              ...(accessibleClassIds?.length ? [{ schoolClassId: { in: accessibleClassIds } }] : []),
            ],
          }
        : {}),
    },
    include: {
      schoolClass: {
        select: {
          id: true,
          name: true,
          section: true,
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 4,
  });

  return assessments.map((assessment) => {
    const dueDate = assessment.dueDate || today;
    const daysUntilDue = Math.max(
      Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    return {
      id: `assessment-${assessment.id}`,
      title: assessment.title,
      detail: `${assessment.subject.name} for ${getClassLabel(assessment.schoolClass)} is due ${formatLongDateLabel(
        dueDate,
      )}.`,
      time: daysUntilDue === 0 ? "Due today" : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
      tone: assessment.status === "DRAFT" || daysUntilDue <= 1 ? "cream" : "blue",
      route: "/dashboard/assessments",
      category: "Assessment",
      priority: 2,
      sortDate: dueDate,
    };
  });
}

function buildTermNotifications(activeAcademicYear) {
  if (!activeAcademicYear?.terms?.length) {
    return [];
  }

  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 21);

  return activeAcademicYear.terms
    .flatMap((term) => {
      const items = [];

      if (term.startDate >= today && term.startDate <= windowEnd) {
        items.push({
          id: `term-start-${term.id}`,
          title: `${term.name} starts soon`,
          detail: `${term.name} for ${activeAcademicYear.name} begins on ${formatLongDateLabel(term.startDate)}.`,
          time: formatRelativeTime(term.startDate),
          tone: "blue",
          route: "/dashboard/calendar",
          category: "Calendar",
          priority: 3,
          sortDate: term.startDate,
        });
      }

      if (term.endDate >= today && term.endDate <= windowEnd) {
        items.push({
          id: `term-end-${term.id}`,
          title: `${term.name} ends soon`,
          detail: `${term.name} for ${activeAcademicYear.name} closes on ${formatLongDateLabel(term.endDate)}.`,
          time: formatRelativeTime(term.endDate),
          tone: "cream",
          route: "/dashboard/calendar",
          category: "Calendar",
          priority: 3,
          sortDate: term.endDate,
        });
      }

      return items;
    })
    .slice(0, 2);
}

export async function getNotificationsOverview({ userId, role }) {
  if (!supportedRoles.has(role)) {
    return {
      messages: [],
      notifications: [],
      summary: {
        messagesCount: 0,
        notificationsCount: 0,
      },
    };
  }

  const activeAcademicYear = await getActiveAcademicYear();
  const teacherContext = role === "TEACHER" ? await getTeacherContext(userId) : null;
  const accessibleClassIds = role === "TEACHER" ? teacherContext?.accessibleClassIds || [] : null;
  const teacherId = role === "TEACHER" ? teacherContext?.teacherId || null : null;

  const [messages, attendanceNotifications, assessmentNotifications] = await Promise.all([
    buildMessages({ role, userId }),
    buildAttendanceNotifications({
      academicYearId: activeAcademicYear?.id,
      accessibleClassIds,
    }),
    buildAssessmentNotifications({
      academicYearId: activeAcademicYear?.id,
      accessibleClassIds,
      teacherId,
      role,
    }),
  ]);

  const notifications = [...attendanceNotifications, ...assessmentNotifications, ...buildTermNotifications(activeAcademicYear)]
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return new Date(left.sortDate) - new Date(right.sortDate);
    })
    .slice(0, 6)
    .map((item) => {
      const cleanItem = { ...item };
      delete cleanItem.priority;
      delete cleanItem.sortDate;
      return cleanItem;
    });

  return {
    messages,
    notifications,
    summary: {
      messagesCount: messages.length,
      notificationsCount: notifications.length,
    },
  };
}
