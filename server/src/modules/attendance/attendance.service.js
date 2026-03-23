import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";

const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

function parseMonthValue(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  return {
    year,
    monthNumber,
    start,
    end,
    daysInMonth,
  };
}

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatClassLabel(schoolClass) {
  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function buildMonthDays(month) {
  const { year, monthNumber, daysInMonth } = parseMonthValue(month);
  const todayKey = new Date().toISOString().slice(0, 10);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(Date.UTC(year, monthNumber - 1, index + 1));
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      dayNumber: index + 1,
      weekdayShort: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      isWeekend: [0, 6].includes(date.getUTCDay()),
      isToday: dateKey === todayKey,
    };
  });
}

async function getRecorderTeacherId(userId) {
  if (!userId) {
    return null;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });

  return teacher?.id || null;
}

function buildSessionSummaries(attendanceRecords, rosterCount) {
  const groupedByDate = attendanceRecords.reduce((groups, record) => {
    const key = toDateKey(record.date);

    if (!groups.has(key)) {
      groups.set(key, {
        date: key,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        markedCount: 0,
      });
    }

    const entry = groups.get(key);

    if (record.status === "PRESENT") {
      entry.presentCount += 1;
    } else if (record.status === "ABSENT") {
      entry.absentCount += 1;
    } else if (record.status === "LATE") {
      entry.lateCount += 1;
    } else if (record.status === "EXCUSED") {
      entry.excusedCount += 1;
    }

    entry.markedCount += 1;

    return groups;
  }, new Map());

  return Array.from(groupedByDate.values())
    .map((session) => ({
      ...session,
      notMarkedCount: Math.max(rosterCount - session.markedCount, 0),
      completionRate: rosterCount ? Math.round((session.markedCount / rosterCount) * 100) : 0,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getAttendanceMeta(userId) {
  const [classes, academicYears, recorderTeacherId] = await Promise.all([
    prisma.schoolClass.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }, { section: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        section: true,
      },
    }),
    prisma.academicYear.findMany({
      include: {
        terms: {
          orderBy: [{ startDate: "asc" }],
        },
      },
      orderBy: [{ startDate: "desc" }],
    }),
    getRecorderTeacherId(userId),
  ]);

  return {
    classes: classes.map((schoolClass) => ({
      ...schoolClass,
      label: formatClassLabel(schoolClass),
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
    attendanceStatuses,
    recorderTeacherId,
  };
}

export async function getAttendanceBoard(filters) {
  const { schoolClassId, academicYearId, termId, month } = filters;
  const monthWindow = parseMonthValue(month);
  const days = buildMonthDays(month);

  const [schoolClass, academicYear, term, enrollments, attendanceRecords] = await Promise.all([
    prisma.schoolClass.findUnique({
      where: { id: schoolClassId },
      select: { id: true, name: true, section: true, level: true },
    }),
    prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true, name: true, isActive: true },
    }),
    termId
      ? prisma.term.findUnique({
          where: { id: termId },
          select: { id: true, name: true, academicYearId: true, isActive: true },
        })
      : Promise.resolve(null),
    prisma.enrollment.findMany({
      where: {
        schoolClassId,
        academicYearId,
        status: "ACTIVE",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: {
        schoolClassId,
        academicYearId,
        ...(termId ? { termId } : {}),
        date: {
          gte: monthWindow.start,
          lt: monthWindow.end,
        },
      },
      include: {
        student: true,
      },
      orderBy: [{ date: "asc" }],
    }),
  ]);

  if (!schoolClass || !academicYear) {
    throw new AppError("Selected class or academic year does not exist.", 400);
  }

  if (termId && (!term || term.academicYearId !== academicYearId)) {
    throw new AppError("Selected term does not belong to the chosen academic year.", 400);
  }

  const attendanceMap = attendanceRecords.reduce((map, record) => {
    const studentKey = record.studentId;
    const dateKey = toDateKey(record.date);

    if (!map.has(studentKey)) {
      map.set(studentKey, {});
    }

    map.get(studentKey)[dateKey] = {
      id: record.id,
      status: record.status,
      remarks: record.remarks,
      recordedById: record.recordedById,
    };

    return map;
  }, new Map());

  const students = enrollments
    .map((enrollment) => ({
      id: enrollment.student.id,
      admissionNumber: enrollment.student.admissionNumber,
      fullName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
      attendanceByDate: attendanceMap.get(enrollment.student.id) || {},
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  const rosterCount = students.length;
  const presentCount = attendanceRecords.filter((record) => record.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((record) => record.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((record) => record.status === "LATE").length;
  const excusedCount = attendanceRecords.filter((record) => record.status === "EXCUSED").length;
  const markedCount = attendanceRecords.length;
  const totalSlots = rosterCount * monthWindow.daysInMonth;
  const notMarkedCount = Math.max(totalSlots - markedCount, 0);
  const attendanceRate = markedCount
    ? Math.round(((presentCount + lateCount + excusedCount) / markedCount) * 100)
    : 0;

  return {
    filters: {
      month,
      schoolClass: {
        id: schoolClass.id,
        label: formatClassLabel(schoolClass),
        level: schoolClass.level,
      },
      academicYear,
      term,
    },
    days,
    students,
    summary: {
      rosterCount,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      markedCount,
      notMarkedCount,
      attendanceRate,
      totalSlots,
    },
    recentSessions: buildSessionSummaries(attendanceRecords, rosterCount).slice(0, 6),
  };
}

export async function saveAttendanceSession({ userId, schoolClassId, academicYearId, termId, date, entries }) {
  const recorderTeacherId = await getRecorderTeacherId(userId);
  const attendanceDate = new Date(date);

  if (Number.isNaN(attendanceDate.getTime())) {
    throw new AppError("Attendance date is invalid.", 400);
  }

  const [schoolClass, academicYear, term] = await Promise.all([
    prisma.schoolClass.findUnique({
      where: { id: schoolClassId },
      select: { id: true },
    }),
    prisma.academicYear.findUnique({
      where: { id: academicYearId },
      select: { id: true },
    }),
    termId
      ? prisma.term.findUnique({
          where: { id: termId },
          select: { id: true, academicYearId: true },
        })
      : Promise.resolve(null),
  ]);

  if (!schoolClass || !academicYear) {
    throw new AppError("Selected class or academic year does not exist.", 400);
  }

  if (termId && (!term || term.academicYearId !== academicYearId)) {
    throw new AppError("Selected term does not belong to the chosen academic year.", 400);
  }

  const validStudentIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: {
          schoolClassId,
          academicYearId,
          status: "ACTIVE",
          studentId: {
            in: entries.map((entry) => entry.studentId),
          },
        },
        select: {
          studentId: true,
        },
      })
    ).map((enrollment) => enrollment.studentId),
  );

  const invalidEntry = entries.find((entry) => !validStudentIds.has(entry.studentId));

  if (invalidEntry) {
    throw new AppError("One or more attendance entries do not belong to the selected class roster.", 400);
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const remarks = entry.remarks?.trim() || null;

      if (!entry.status) {
        await tx.attendanceRecord.deleteMany({
          where: {
            studentId: entry.studentId,
            schoolClassId,
            date: attendanceDate,
          },
        });
        continue;
      }

      await tx.attendanceRecord.upsert({
        where: {
          studentId_schoolClassId_date: {
            studentId: entry.studentId,
            schoolClassId,
            date: attendanceDate,
          },
        },
        update: {
          academicYearId,
          termId: termId || null,
          status: entry.status,
          remarks,
          recordedById: recorderTeacherId,
        },
        create: {
          studentId: entry.studentId,
          schoolClassId,
          academicYearId,
          termId: termId || null,
          date: attendanceDate,
          status: entry.status,
          remarks,
          recordedById: recorderTeacherId,
        },
      });
    }
  });

  return {
    date: toDateKey(attendanceDate),
    recordedById: recorderTeacherId,
  };
}
