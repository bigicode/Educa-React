import { prisma } from "../../config/prisma.js";

const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function roundPercentage(value) {
  return Math.round(value * 10) / 10;
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNamesShort[date.getUTCMonth()]}`;
}

function formatLongDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNamesShort[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Class";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function buildRecentWeeks(count) {
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const weekdayIndex = utcToday.getUTCDay();
  const mondayOffset = (weekdayIndex + 6) % 7;
  const currentWeekStart = new Date(utcToday);
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - mondayOffset);

  return Array.from({ length: count }, (_, index) => {
    const offsetWeeks = count - index - 1;
    const start = new Date(currentWeekStart);
    start.setUTCDate(start.getUTCDate() - offsetWeeks * 7);

    const endExclusive = new Date(start);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 7);

    return {
      key: toDateKey(start),
      label: formatDateLabel(start),
      start,
      endExclusive,
    };
  });
}

function buildWeeklyTrend(records) {
  const weeks = buildRecentWeeks(6);

  return weeks.map((week) => {
    const totals = {
      markedCount: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
    };

    records.forEach((record) => {
      if (record.date < week.start || record.date >= week.endExclusive) {
        return;
      }

      totals.markedCount += 1;

      if (record.status === "PRESENT") {
        totals.presentCount += 1;
      }

      if (record.status === "ABSENT") {
        totals.absentCount += 1;
      }

      if (record.status === "LATE") {
        totals.lateCount += 1;
      }

      if (record.status === "EXCUSED") {
        totals.excusedCount += 1;
      }
    });

    const attendedCount = totals.presentCount + totals.lateCount + totals.excusedCount;
    const attendanceRate = totals.markedCount ? roundPercentage((attendedCount / totals.markedCount) * 100) : 0;
    const absentRate = totals.markedCount ? roundPercentage((totals.absentCount / totals.markedCount) * 100) : 0;

    return {
      week: week.label,
      attendance: attendanceRate,
      absent: absentRate,
      markedCount: totals.markedCount,
    };
  });
}

function buildSnapshotSummary(records, totalActiveStudents) {
  const presentCount = records.filter((record) => record.status === "PRESENT").length;
  const absentCount = records.filter((record) => record.status === "ABSENT").length;
  const lateCount = records.filter((record) => record.status === "LATE").length;
  const excusedCount = records.filter((record) => record.status === "EXCUSED").length;
  const markedCount = records.length;
  const attendedCount = presentCount + lateCount + excusedCount;
  const attendanceRate = markedCount ? roundPercentage((attendedCount / markedCount) * 100) : 0;
  const recordedClassesCount = new Set(records.map((record) => record.schoolClassId)).size;

  return {
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    markedCount,
    attendanceRate,
    recordedClassesCount,
    notMarkedCount: Math.max(totalActiveStudents - markedCount, 0),
  };
}

function buildAttendanceAlerts(records, snapshotDate) {
  const groupedByClass = records.reduce((groups, record) => {
    const current = groups.get(record.schoolClassId) || {
      schoolClassId: record.schoolClassId,
      label: getClassLabel(record.schoolClass),
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

    groups.set(record.schoolClassId, current);
    return groups;
  }, new Map());

  return Array.from(groupedByClass.values())
    .map((classSummary) => {
      const attendedCount =
        classSummary.presentCount + classSummary.lateCount + classSummary.excusedCount;
      const attendanceRate = classSummary.markedCount
        ? roundPercentage((attendedCount / classSummary.markedCount) * 100)
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
    .slice(0, 4)
    .map((classSummary) => {
      const tone =
        classSummary.attendanceRate < 85
          ? "rose"
          : classSummary.absentCount >= 3 || classSummary.lateCount >= 2
            ? "cream"
            : "blue";

      return {
        title: `${classSummary.label} attendance at ${classSummary.attendanceRate}%`,
        detail: `${classSummary.absentCount} absent, ${classSummary.lateCount} late, ${classSummary.excusedCount} excused on ${formatLongDateLabel(
          snapshotDate,
        )}.`,
        tone,
      };
    });
}

function buildRecentSessions(records) {
  const groupedByDate = records.reduce((groups, record) => {
    const dateKey = toDateKey(record.date);
    const current = groups.get(dateKey) || {
      date: dateKey,
      markedCount: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      classes: new Set(),
    };

    current.markedCount += 1;
    current.classes.add(record.schoolClassId);

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

    groups.set(dateKey, current);
    return groups;
  }, new Map());

  return Array.from(groupedByDate.values())
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 5)
    .map((session) => {
      const attendedCount = session.presentCount + session.lateCount + session.excusedCount;
      const attendanceRate = session.markedCount
        ? roundPercentage((attendedCount / session.markedCount) * 100)
        : 0;

      return {
        date: session.date,
        label: formatLongDateLabel(session.date),
        attendanceRate,
        absentCount: session.absentCount,
        classesCount: session.classes.size,
      };
    });
}

async function getActiveAcademicYear() {
  return (
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        terms: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          take: 1,
        },
      },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: { startDate: "desc" },
      include: {
        terms: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          take: 1,
        },
      },
    }))
  );
}

function buildFinanceOverview(activeAcademicYear, totalActiveStudents) {
  return {
    isConfigured: false,
    title: "Finance module is not configured yet",
    message:
      "The system no longer shows placeholder fee totals. Add fee structures, payments, and receipts before finance analytics go live.",
    checklist: [
      {
        label: "Fee structures",
        status: "Pending",
        detail: "Create term or annual fee plans before collections can be tracked.",
      },
      {
        label: "Payment ledger",
        status: "Pending",
        detail: "Payment tables and receipt records have not been added to the schema yet.",
      },
      {
        label: "Gateway integration",
        status: "Pending",
        detail: "No online payment provider is connected yet.",
      },
      {
        label: "Operational foundation",
        status: activeAcademicYear ? "Ready" : "Pending",
        detail: activeAcademicYear
          ? `${totalActiveStudents} active enrollments in ${activeAcademicYear.name}.`
          : "Set an active academic year first.",
      },
    ],
  };
}

function buildAdminOperations(snapshot, attendanceAlerts, recentAssessments, activeAcademicYear) {
  return [
    {
      title: "Latest attendance roll call",
      time: snapshot.dateLabel,
      status: snapshot.markedCount ? "Ready" : "Pending",
    },
    {
      title: "Attendance watchlist review",
      time: `${attendanceAlerts.length} flagged classes`,
      status: attendanceAlerts.length ? "In progress" : "Ready",
    },
    {
      title: "Assessment publication board",
      time: `${recentAssessments.filter((item) => item.status === "PUBLISHED").length} published recently`,
      status: recentAssessments.some((item) => item.status === "DRAFT") ? "Priority" : "Scheduled",
    },
    {
      title: "Academic year operations",
      time: activeAcademicYear?.name || "Not configured",
      status: activeAcademicYear ? "Ready" : "Pending",
    },
  ];
}

function buildTeacherOperations(snapshot, attendanceAlerts, recentAssessments, draftCount) {
  const nextAssessment = recentAssessments.find((item) => item.dueDate);

  return [
    {
      title: "Class attendance review",
      time: snapshot.dateLabel,
      status: snapshot.markedCount ? "Ready" : "Pending",
    },
    {
      title: nextAssessment ? nextAssessment.title : "Next assessment due",
      time: nextAssessment?.dueDate ? formatLongDateLabel(nextAssessment.dueDate) : "No due date set",
      status: nextAssessment ? "Scheduled" : "Ready",
    },
    {
      title: "Assessment drafts to publish",
      time: `${draftCount} draft assessments`,
      status: draftCount ? "Priority" : "Ready",
    },
    {
      title: "Attendance follow-up queue",
      time: `${attendanceAlerts.length} flagged classes`,
      status: attendanceAlerts.length ? "In progress" : "Ready",
    },
  ];
}

function buildAdminCommunications(attendanceAlerts, recentSessions, recentAssessments) {
  const items = [];

  if (attendanceAlerts.length) {
    items.push({
      title: "Attendance watchlist prepared",
      body: `${attendanceAlerts.length} class alerts are ready for admin follow-up from the latest roll call.`,
      time: "Attendance automation",
    });
  }

  if (recentAssessments.length) {
    const publishedCount = recentAssessments.filter((assessment) => assessment.status === "PUBLISHED").length;

    items.push({
      title: "Assessment publication summary",
      body: `${publishedCount} recent assessments are published and visible to the academic workflow.`,
      time: "Assessment board",
    });
  }

  if (recentSessions.length) {
    items.push({
      title: "Daily attendance summary synced",
      body: `${recentSessions[0].classesCount} classes submitted attendance on ${recentSessions[0].label}.`,
      time: recentSessions[0].label,
    });
  }

  return items;
}

function buildTeacherCommunications(attendanceAlerts, recentAssessments, draftCount) {
  const items = [];

  if (draftCount) {
    items.push({
      title: "Assessment drafts waiting for you",
      body: `${draftCount} draft assessments still need review or publishing.`,
      time: "Assessment workflow",
    });
  }

  const dueSoonAssessment = recentAssessments.find((assessment) => assessment.dueDate);

  if (dueSoonAssessment) {
    items.push({
      title: "Upcoming assessment deadline",
      body: `${dueSoonAssessment.subjectName} for ${dueSoonAssessment.classLabel} is due on ${formatLongDateLabel(
        dueSoonAssessment.dueDate,
      )}.`,
      time: "Due soon",
    });
  }

  if (attendanceAlerts.length) {
    items.push({
      title: "Class follow-up needed",
      body: attendanceAlerts[0].detail,
      time: attendanceAlerts[0].title,
    });
  }

  return items;
}

function serializeAssessment(assessment) {
  return {
    id: assessment.id,
    title: assessment.title,
    status: assessment.status,
    dueDate: assessment.dueDate,
    totalMarks: assessment.totalMarks,
    subjectName: assessment.subject.name,
    classLabel: getClassLabel(assessment.schoolClass),
  };
}

async function buildAdminDashboardOverview(activeAcademicYear) {
  const activeAcademicYearId = activeAcademicYear?.id;
  const activeTerm = activeAcademicYear?.terms?.[0] || null;
  const recentWeeks = buildRecentWeeks(6);

  const [latestAttendanceRecord, totalActiveStudents, recentAttendanceRecords, recentAssessments] = await Promise.all([
    prisma.attendanceRecord.findFirst({
      where: activeAcademicYearId ? { academicYearId: activeAcademicYearId } : undefined,
      orderBy: { date: "desc" },
      select: { date: true },
    }),
    prisma.enrollment.count({
      where: {
        ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
        status: "ACTIVE",
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
        date: {
          gte: recentWeeks[0].start,
        },
      },
      select: {
        date: true,
        status: true,
      },
    }),
    prisma.assessment.findMany({
      where: activeAcademicYearId ? { academicYearId: activeAcademicYearId } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      include: {
        subject: { select: { name: true } },
        schoolClass: { select: { name: true, section: true } },
      },
    }),
  ]);

  const snapshotDate = latestAttendanceRecord?.date || null;

  const [snapshotRecords, latestSessions] = snapshotDate
    ? await Promise.all([
        prisma.attendanceRecord.findMany({
          where: {
            ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
            date: snapshotDate,
          },
          include: {
            schoolClass: {
              select: {
                name: true,
                section: true,
              },
            },
          },
        }),
        prisma.attendanceRecord.findMany({
          where: {
            ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
            date: {
              lte: snapshotDate,
            },
          },
          orderBy: { date: "desc" },
          take: 500,
          select: {
            date: true,
            status: true,
            schoolClassId: true,
          },
        }),
      ])
    : [[], []];

  const snapshotSummary = buildSnapshotSummary(snapshotRecords, totalActiveStudents);
  const snapshot = {
    date: snapshotDate ? toDateKey(snapshotDate) : null,
    dateLabel: snapshotDate ? formatLongDateLabel(snapshotDate) : "No attendance recorded yet",
    academicYear: activeAcademicYear
      ? {
          id: activeAcademicYear.id,
          name: activeAcademicYear.name,
        }
      : null,
    term: activeTerm
      ? {
          id: activeTerm.id,
          name: activeTerm.name,
        }
      : null,
    totalActiveStudents,
    ...snapshotSummary,
  };
  const attendanceAlerts = snapshotDate ? buildAttendanceAlerts(snapshotRecords, snapshotDate) : [];
  const normalizedAssessments = recentAssessments.map(serializeAssessment);
  const recentSessionsSummary = buildRecentSessions(latestSessions);

  return {
    scope: "ADMIN",
    snapshot,
    attendanceTrend: buildWeeklyTrend(recentAttendanceRecords),
    attendanceAlerts,
    recentSessions: recentSessionsSummary,
    operations: buildAdminOperations(snapshot, attendanceAlerts, normalizedAssessments, activeAcademicYear),
    communications: buildAdminCommunications(attendanceAlerts, recentSessionsSummary, normalizedAssessments),
    finance: buildFinanceOverview(activeAcademicYear, totalActiveStudents),
  };
}

async function buildTeacherDashboardOverview(userId, activeAcademicYear) {
  const activeAcademicYearId = activeAcademicYear?.id;
  const activeTerm = activeAcademicYear?.terms?.[0] || null;
  const recentWeeks = buildRecentWeeks(6);

  const teacher = await prisma.teacher.findFirst({
    where: { userId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      homeroomClasses: {
        orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
        select: {
          id: true,
          name: true,
          section: true,
        },
      },
      subjectAssignments: {
        orderBy: [{ createdAt: "desc" }],
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
              section: true,
            },
          },
        },
      },
    },
  });

  const ownedClassesMap = new Map();

  teacher?.homeroomClasses.forEach((schoolClass) => {
    ownedClassesMap.set(schoolClass.id, schoolClass);
  });

  teacher?.subjectAssignments.forEach((assignment) => {
    if (assignment.schoolClass) {
      ownedClassesMap.set(assignment.schoolClass.id, assignment.schoolClass);
    }
  });

  const ownedClasses = Array.from(ownedClassesMap.values()).map((schoolClass) => ({
    id: schoolClass.id,
    label: getClassLabel(schoolClass),
  }));
  const ownedClassIds = ownedClasses.map((schoolClass) => schoolClass.id);
  const uniqueSubjects = Array.from(
    new Map(
      (teacher?.subjectAssignments || []).map((assignment) => [
        assignment.subject.id,
        {
          id: assignment.subject.id,
          name: assignment.subject.name,
          code: assignment.subject.code,
        },
      ]),
    ).values(),
  );

  if (!teacher || !ownedClassIds.length) {
    return {
      scope: "TEACHER",
      snapshot: {
        date: null,
        dateLabel: "No assigned classes yet",
        academicYear: activeAcademicYear ? { id: activeAcademicYear.id, name: activeAcademicYear.name } : null,
        term: activeTerm ? { id: activeTerm.id, name: activeTerm.name } : null,
        totalActiveStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        markedCount: 0,
        attendanceRate: 0,
        recordedClassesCount: 0,
        notMarkedCount: 0,
      },
      attendanceTrend: [],
      attendanceAlerts: [],
      recentSessions: [],
      teacher: {
        employeeCode: teacher?.employeeCode || null,
        homeroomClasses: teacher?.homeroomClasses?.map((schoolClass) => ({
          id: schoolClass.id,
          label: getClassLabel(schoolClass),
        })) || [],
        assignedClasses: ownedClasses,
        subjects: uniqueSubjects,
      },
      teacherSummary: {
        assignedClassesCount: ownedClasses.length,
        subjectCount: uniqueSubjects.length,
        activeStudentsCount: 0,
        draftAssessmentsCount: 0,
        publishedAssessmentsCount: 0,
      },
      recentAssessments: [],
      operations: [
        { title: "Class assignments", time: "No class ownership", status: "Pending" },
        { title: "Assessment board", time: "No assessments created yet", status: "Ready" },
      ],
      communications: [
        {
          title: "Teacher dashboard is ready",
          body: "Assign a homeroom class or subject ownership to begin live class operations.",
          time: "Setup",
        },
      ],
      finance: null,
    };
  }

  const [latestAttendanceRecord, totalActiveStudents, recentAttendanceRecords, recentAssessmentRows, latestSessions] =
    await Promise.all([
      prisma.attendanceRecord.findFirst({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          schoolClassId: { in: ownedClassIds },
        },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      prisma.enrollment.count({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          schoolClassId: { in: ownedClassIds },
          status: "ACTIVE",
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          schoolClassId: { in: ownedClassIds },
          date: {
            gte: recentWeeks[0].start,
          },
        },
        select: {
          date: true,
          status: true,
        },
      }),
      prisma.assessment.findMany({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          assignedById: teacher.id,
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 8,
        include: {
          subject: { select: { name: true } },
          schoolClass: { select: { name: true, section: true } },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          schoolClassId: { in: ownedClassIds },
        },
        orderBy: { date: "desc" },
        take: 300,
        select: {
          date: true,
          status: true,
          schoolClassId: true,
        },
      }),
    ]);

  const snapshotDate = latestAttendanceRecord?.date || null;
  const snapshotRecords = snapshotDate
    ? await prisma.attendanceRecord.findMany({
        where: {
          ...(activeAcademicYearId ? { academicYearId: activeAcademicYearId } : {}),
          schoolClassId: { in: ownedClassIds },
          date: snapshotDate,
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
      })
    : [];

  const snapshotSummary = buildSnapshotSummary(snapshotRecords, totalActiveStudents);
  const snapshot = {
    date: snapshotDate ? toDateKey(snapshotDate) : null,
    dateLabel: snapshotDate ? formatLongDateLabel(snapshotDate) : "No attendance recorded yet",
    academicYear: activeAcademicYear ? { id: activeAcademicYear.id, name: activeAcademicYear.name } : null,
    term: activeTerm ? { id: activeTerm.id, name: activeTerm.name } : null,
    totalActiveStudents,
    ...snapshotSummary,
  };

  const attendanceAlerts = snapshotDate ? buildAttendanceAlerts(snapshotRecords, snapshotDate) : [];
  const recentAssessments = recentAssessmentRows.map(serializeAssessment);
  const draftAssessmentsCount = recentAssessments.filter((assessment) => assessment.status === "DRAFT").length;
  const publishedAssessmentsCount = recentAssessments.filter((assessment) => assessment.status === "PUBLISHED").length;
  const recentSessionsSummary = buildRecentSessions(latestSessions);

  return {
    scope: "TEACHER",
    snapshot,
    attendanceTrend: buildWeeklyTrend(recentAttendanceRecords),
    attendanceAlerts,
    recentSessions: recentSessionsSummary,
    teacher: {
      employeeCode: teacher.employeeCode,
      homeroomClasses: teacher.homeroomClasses.map((schoolClass) => ({
        id: schoolClass.id,
        label: getClassLabel(schoolClass),
      })),
      assignedClasses: ownedClasses,
      subjects: uniqueSubjects,
    },
    teacherSummary: {
      assignedClassesCount: ownedClasses.length,
      subjectCount: uniqueSubjects.length,
      activeStudentsCount: totalActiveStudents,
      draftAssessmentsCount,
      publishedAssessmentsCount,
    },
    recentAssessments,
    operations: buildTeacherOperations(snapshot, attendanceAlerts, recentAssessments, draftAssessmentsCount),
    communications: buildTeacherCommunications(attendanceAlerts, recentAssessments, draftAssessmentsCount),
    finance: null,
  };
}

export async function getDashboardOverview({ userId, role }) {
  const activeAcademicYear = await getActiveAcademicYear();

  if (role === "TEACHER") {
    return buildTeacherDashboardOverview(userId, activeAcademicYear);
  }

  return buildAdminDashboardOverview(activeAcademicYear);
}
