import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const calendarRoles = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);
const eventTypeLabels = {
  TERM_START: "Term Start",
  TERM_END: "Term End",
  ASSESSMENT_DUE: "Assessment Due",
  ANNOUNCEMENT: "Announcement",
  ATTENDANCE_SESSION: "Attendance Session",
};

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Class";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
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

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
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
    }))
  );
}

async function resolveScope({ userId, role, filters = {} }) {
  if (!calendarRoles.has(role)) {
    throw new AppError("Calendar is not available for this account yet.", 403);
  }

  const activeAcademicYear = await getActiveAcademicYear();
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

  const defaultDateFrom = toStartOfDay(new Date(selectedAcademicYear.startDate));
  const defaultDateTo = toEndOfDay(new Date(selectedAcademicYear.endDate));

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

    if (filters.schoolClassId && !accessibleClassMap.has(filters.schoolClassId)) {
      throw new AppError("That class is outside your calendar scope.", 403);
    }

    return {
      role,
      teacherId: teacher.id,
      academicYear: selectedAcademicYear,
      schoolClassId: filters.schoolClassId || null,
      accessibleClasses: Array.from(accessibleClassMap.values()),
      accessibleClassIds: Array.from(accessibleClassMap.keys()),
      dateFrom: filters.dateFrom ? toStartOfDay(filters.dateFrom) : defaultDateFrom,
      dateTo: filters.dateTo ? toEndOfDay(filters.dateTo) : defaultDateTo,
    };
  }

  const classes = await prisma.schoolClass.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      section: true,
    },
  });

  return {
    role,
    teacherId: null,
    academicYear: selectedAcademicYear,
    schoolClassId: filters.schoolClassId || null,
    accessibleClasses: classes,
    accessibleClassIds: classes.map((schoolClass) => schoolClass.id),
    dateFrom: filters.dateFrom ? toStartOfDay(filters.dateFrom) : defaultDateFrom,
    dateTo: filters.dateTo ? toEndOfDay(filters.dateTo) : defaultDateTo,
  };
}

export async function getCalendarMeta({ userId, role }) {
  const scope = await resolveScope({ userId, role, filters: {} });
  const academicYears = await prisma.academicYear.findMany({
    orderBy: [{ startDate: "desc" }],
    include: {
      terms: {
        orderBy: [{ startDate: "asc" }],
      },
    },
  });

  return {
    scope: scope.role,
    academicYears: academicYears.map((year) => ({
      id: year.id,
      name: year.name,
      isActive: year.isActive,
      startDate: year.startDate,
      endDate: year.endDate,
      terms: year.terms.map((term) => ({
        id: term.id,
        name: term.name,
        isActive: term.isActive,
        startDate: term.startDate,
        endDate: term.endDate,
      })),
    })),
    classes: scope.accessibleClasses.map((schoolClass) => ({
      id: schoolClass.id,
      label: getClassLabel(schoolClass),
      level: schoolClass.level,
    })),
  };
}

function buildTermEvents(terms, rangeStart, rangeEnd) {
  const events = [];

  terms.forEach((term) => {
    const termStart = new Date(term.startDate);
    const termEnd = new Date(term.endDate);

    if (termStart >= rangeStart && termStart <= rangeEnd) {
      events.push({
        id: `term-start-${term.id}`,
        type: "TERM_START",
        title: `${term.name} starts`,
        start: toDateKey(termStart),
        end: toDateKey(termStart),
        allDay: true,
        detail: `Academic term opens for ${term.academicYear.name}.`,
      });
    }

    if (termEnd >= rangeStart && termEnd <= rangeEnd) {
      events.push({
        id: `term-end-${term.id}`,
        type: "TERM_END",
        title: `${term.name} ends`,
        start: toDateKey(termEnd),
        end: toDateKey(termEnd),
        allDay: true,
        detail: `Academic term closes for ${term.academicYear.name}.`,
      });
    }
  });

  return events;
}

function buildAssessmentEvents(assessments) {
  return assessments
    .filter((assessment) => assessment.dueDate)
    .map((assessment) => ({
      id: `assessment-${assessment.id}`,
      type: "ASSESSMENT_DUE",
      title: assessment.title,
      start: toDateKey(assessment.dueDate),
      end: toDateKey(assessment.dueDate),
      allDay: true,
      classLabel: getClassLabel(assessment.schoolClass),
      subjectName: assessment.subject.name,
      status: assessment.status,
      detail: `${assessment.subject.name} for ${getClassLabel(assessment.schoolClass)} is ${assessment.status.toLowerCase()}.`,
    }));
}

function buildAttendanceEvents(attendanceRecords) {
  const grouped = attendanceRecords.reduce((map, record) => {
    const key = `${record.schoolClassId}:${toDateKey(record.date)}`;
    const current = map.get(key) || {
      id: `attendance-${record.schoolClassId}-${toDateKey(record.date)}`,
      type: "ATTENDANCE_SESSION",
      title: `Attendance submitted - ${getClassLabel(record.schoolClass)}`,
      start: toDateKey(record.date),
      end: toDateKey(record.date),
      allDay: true,
      classLabel: getClassLabel(record.schoolClass),
      markedCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
    };

    current.markedCount += 1;

    if (record.status === "ABSENT") {
      current.absentCount += 1;
    }

    if (record.status === "LATE") {
      current.lateCount += 1;
    }

    if (record.status === "EXCUSED") {
      current.excusedCount += 1;
    }

    map.set(key, current);
    return map;
  }, new Map());

  return Array.from(grouped.values()).map((event) => ({
    ...event,
    detail: `${event.markedCount} marked, ${event.absentCount} absent, ${event.lateCount} late.`,
  }));
}

async function buildAnnouncementEvents({ role, userId, rangeStart, rangeEnd }) {
  const announcementDelegate = getAnnouncementDelegate();

  if (!announcementDelegate) {
    return [];
  }

  try {
    const announcements = await announcementDelegate.findMany({
      where: {
        ...(role === "TEACHER"
          ? {
              OR: [{ status: "PUBLISHED" }, { createdById: userId }],
            }
          : { status: "PUBLISHED" }),
        OR: [
          {
            publishedAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          {
            createdAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: "ANNOUNCEMENT",
      title: announcement.title,
      start: toDateKey(announcement.publishedAt || announcement.createdAt),
      end: toDateKey(announcement.publishedAt || announcement.createdAt),
      allDay: true,
      audienceLabel: announcement.audience,
      status: announcement.status,
      detail: `Announcement for ${announcement.audience.toLowerCase().replace(/_/g, " ")} by ${announcement.createdBy.firstName} ${announcement.createdBy.lastName}.`,
    }));
  } catch {
    return [];
  }
}

function buildUpcomingEvents(events) {
  const todayKey = formatDateLabel(new Date());

  return events
    .filter((event) => event.start >= todayKey)
    .sort((left, right) => left.start.localeCompare(right.start))
    .slice(0, 8);
}

function buildSummary(events) {
  const counts = events.reduce(
    (summary, event) => {
      summary.totalEvents += 1;

      if (event.type === "ASSESSMENT_DUE") {
        summary.assessmentCount += 1;
      }

      if (event.type === "ANNOUNCEMENT") {
        summary.announcementCount += 1;
      }

      if (event.type === "ATTENDANCE_SESSION") {
        summary.attendanceCount += 1;
      }

      if (event.type === "TERM_START" || event.type === "TERM_END") {
        summary.termMilestoneCount += 1;
      }

      return summary;
    },
    {
      totalEvents: 0,
      assessmentCount: 0,
      announcementCount: 0,
      attendanceCount: 0,
      termMilestoneCount: 0,
    },
  );

  return {
    ...counts,
    upcomingCount: buildUpcomingEvents(events).length,
  };
}

export async function getCalendarEvents({ userId, role, filters }) {
  const scope = await resolveScope({ userId, role, filters });

  const [terms, assessments, attendanceRecords, announcements] = await Promise.all([
    prisma.term.findMany({
      where: {
        academicYearId: scope.academicYear.id,
        OR: [
          {
            startDate: {
              gte: scope.dateFrom,
              lte: scope.dateTo,
            },
          },
          {
            endDate: {
              gte: scope.dateFrom,
              lte: scope.dateTo,
            },
          },
        ],
      },
      include: {
        academicYear: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }],
    }),
    prisma.assessment.findMany({
      where: {
        academicYearId: scope.academicYear.id,
        dueDate: {
          gte: scope.dateFrom,
          lte: scope.dateTo,
        },
        ...(scope.schoolClassId
          ? { schoolClassId: scope.schoolClassId }
          : scope.role === "TEACHER"
            ? { schoolClassId: { in: scope.accessibleClassIds } }
            : {}),
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        schoolClass: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: {
        academicYearId: scope.academicYear.id,
        date: {
          gte: scope.dateFrom,
          lte: scope.dateTo,
        },
        ...(scope.schoolClassId
          ? { schoolClassId: scope.schoolClassId }
          : scope.role === "TEACHER"
            ? { schoolClassId: { in: scope.accessibleClassIds } }
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
      },
      orderBy: [{ date: "asc" }],
    }),
    buildAnnouncementEvents({
      role,
      userId,
      rangeStart: scope.dateFrom,
      rangeEnd: scope.dateTo,
    }),
  ]);

  const events = [
    ...buildTermEvents(terms, scope.dateFrom, scope.dateTo),
    ...buildAssessmentEvents(assessments),
    ...buildAttendanceEvents(attendanceRecords),
    ...announcements,
  ].sort((left, right) => {
    if (left.start !== right.start) {
      return left.start.localeCompare(right.start);
    }

    return left.title.localeCompare(right.title);
  });

  return {
    scope: scope.role,
    filters: {
      academicYear: {
        id: scope.academicYear.id,
        name: scope.academicYear.name,
      },
      schoolClassId: scope.schoolClassId,
      dateFrom: scope.dateFrom.toISOString().slice(0, 10),
      dateTo: scope.dateTo.toISOString().slice(0, 10),
    },
    summary: buildSummary(events),
    upcomingEvents: buildUpcomingEvents(events),
    events: events.map((event) => ({
      ...event,
      typeLabel: eventTypeLabels[event.type] || event.type,
    })),
  };
}
