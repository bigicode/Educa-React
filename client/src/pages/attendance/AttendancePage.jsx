import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  CalendarClock,
  CheckCheck,
  Clock3,
  PieChart as PieChartIcon,
  Save,
  UsersRound,
} from "lucide-react";
import { AppSelect } from "../../components/ui/AppSelect";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  fetchAttendanceBoard,
  fetchAttendanceMeta,
  getApiErrorMessage,
  saveAttendanceSession,
} from "../../features/attendance/api";
import { getRevealMotion } from "../../lib/motion";

const attendanceStatusConfig = {
  PRESENT: {
    label: "Present",
    shortLabel: "P",
    chartColor: "#16a34a",
    className:
      "border-[rgba(34,197,94,0.18)] bg-[rgba(220,252,231,0.96)] text-[#15803d] shadow-[inset_0_0_0_1px_rgba(34,197,94,0.05)]",
  },
  ABSENT: {
    label: "Absent",
    shortLabel: "A",
    chartColor: "#e11d48",
    className:
      "border-[rgba(225,29,72,0.16)] bg-[rgba(255,228,230,0.92)] text-[#be123c] shadow-[inset_0_0_0_1px_rgba(225,29,72,0.04)]",
  },
  LATE: {
    label: "Late",
    shortLabel: "L",
    chartColor: "#f59e0b",
    className:
      "border-[rgba(245,158,11,0.18)] bg-[rgba(254,243,199,0.96)] text-[#c2410c] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.05)]",
  },
  EXCUSED: {
    label: "Excused",
    shortLabel: "E",
    chartColor: "#2563eb",
    className:
      "border-[rgba(37,99,235,0.16)] bg-[rgba(219,234,254,0.96)] text-[#1d4ed8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.04)]",
  },
  UNMARKED: {
    label: "Not marked",
    shortLabel: "-",
    chartColor: "#94a3b8",
    className:
      "border-[rgba(8,39,95,0.08)] bg-white text-[var(--ink-500)] shadow-[inset_0_0_0_1px_rgba(8,39,95,0.02)]",
  },
};

const attendanceStatusCycle = [null, "PRESENT", "ABSENT", "LATE", "EXCUSED"];

function getCurrentMonthValue() {
  return format(new Date(), "yyyy-MM");
}

function getDefaultSelectedDateKey(monthValue) {
  const today = format(new Date(), "yyyy-MM-dd");

  if (today.startsWith(monthValue)) {
    return today;
  }

  return `${monthValue}-01`;
}

function getNextAttendanceStatus(status) {
  const currentIndex = attendanceStatusCycle.indexOf(status || null);
  return attendanceStatusCycle[(currentIndex + 1) % attendanceStatusCycle.length];
}

function formatDateLabel(value, dateFormat = "dd MMM yyyy") {
  if (!value) {
    return "Not recorded";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not recorded";
  }

  return format(parsedDate, dateFormat);
}

function buildAttendanceWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the imported database, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

function AttendanceLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-32 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-2/3 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
        </div>
        <CardSkeleton className="rounded-[30px]" lines={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>

      <div className="surface-card rounded-[30px] p-6">
        <SkeletonBlock className="mb-5 h-4 w-32 rounded-full" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </div>

      <TableSkeleton />
    </div>
  );
}

function AttendanceErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Attendance</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
        The attendance workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function AttendanceChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(8,39,95,0.14)]">
      <p className="text-sm font-semibold text-[var(--ink-900)]">{item.name}</p>
      <p className="mt-1 text-sm text-[var(--ink-700)]">{item.value} students</p>
    </div>
  );
}

export function AttendancePage() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue);
  const [selectedDateKey, setSelectedDateKey] = useState(getDefaultSelectedDateKey(getCurrentMonthValue()));
  const [pendingEdits, setPendingEdits] = useState({});
  const deferredSearch = useDeferredValue(search);

  const metaQuery = useQuery({
    queryKey: ["attendance", "meta"],
    queryFn: fetchAttendanceMeta,
  });

  const classes = useMemo(() => metaQuery.data?.classes || [], [metaQuery.data]);
  const academicYears = useMemo(() => metaQuery.data?.academicYears || [], [metaQuery.data]);
  const activeAcademicYear = academicYears.find((year) => year.isActive) || academicYears[0] || null;
  const resolvedAcademicYearId = selectedAcademicYearId || activeAcademicYear?.id || "";
  const resolvedAcademicYear =
    academicYears.find((year) => year.id === resolvedAcademicYearId) || activeAcademicYear || null;
  const resolvedTerms = resolvedAcademicYear?.terms || [];
  const activeTerm = resolvedTerms.find((term) => term.isActive) || resolvedTerms[0] || null;
  const resolvedTermId =
    selectedTermId === "__NONE__"
      ? ""
      : selectedTermId || activeTerm?.id || "";
  const resolvedClassId = selectedClassId || classes[0]?.id || "";

  const boardQuery = useQuery({
    queryKey: [
      "attendance",
      "board",
      {
        schoolClassId: resolvedClassId,
        academicYearId: resolvedAcademicYearId,
        termId: resolvedTermId,
        month: monthValue,
      },
    ],
    queryFn: () =>
      fetchAttendanceBoard({
        schoolClassId: resolvedClassId,
        academicYearId: resolvedAcademicYearId,
        ...(resolvedTermId ? { termId: resolvedTermId } : {}),
        month: monthValue,
      }),
    enabled: Boolean(resolvedClassId && resolvedAcademicYearId),
    placeholderData: (previousData) => previousData,
  });

  const saveSessionMutation = useMutation({
    mutationFn: saveAttendanceSession,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setPendingEdits((current) => ({
        ...current,
        [selectedDateKey]: {},
      }));
      toast.success(response.message || "Attendance session saved successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save the attendance session."));
    },
  });

  const isInitialLoading = metaQuery.isPending || (boardQuery.isPending && !boardQuery.data);
  const errorMessage = buildAttendanceWorkspaceError([
    { label: "Attendance meta", ...metaQuery },
    { label: "Attendance board", ...boardQuery },
  ]);

  const board = boardQuery.data;
  const boardDays = board?.days || [];
  const effectiveSelectedDateKey =
    (boardDays.some((day) => day.date === selectedDateKey) && selectedDateKey) ||
    boardDays.find((day) => day.isToday)?.date ||
    boardDays[0]?.date ||
    getDefaultSelectedDateKey(monthValue);

  const resolvedDateLabel = formatDateLabel(effectiveSelectedDateKey);
  const searchValue = deferredSearch.trim().toLowerCase();

  function getEffectiveEntry(student, dateKey) {
    const draft = pendingEdits[dateKey]?.[student.id];

    if (draft) {
      return draft;
    }

    const persistedEntry = student.attendanceByDate?.[dateKey];

    return {
      studentId: student.id,
      status: persistedEntry?.status || null,
      remarks: persistedEntry?.remarks || "",
    };
  }

  const filteredStudents = useMemo(() => {
    const students = board?.students || [];

    if (!searchValue) {
      return students;
    }

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(searchValue) ||
        student.admissionNumber.toLowerCase().includes(searchValue),
    );
  }, [board?.students, searchValue]);

  const selectedDayDistribution = (() => {
    const students = board?.students || [];
    const summary = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
      UNMARKED: 0,
    };

    students.forEach((student) => {
      const entry = getEffectiveEntry(student, effectiveSelectedDateKey);
      const key = entry.status || "UNMARKED";
      summary[key] += 1;
    });

    return [
      {
        key: "PRESENT",
        name: attendanceStatusConfig.PRESENT.label,
        value: summary.PRESENT,
        color: attendanceStatusConfig.PRESENT.chartColor,
      },
      {
        key: "ABSENT",
        name: attendanceStatusConfig.ABSENT.label,
        value: summary.ABSENT,
        color: attendanceStatusConfig.ABSENT.chartColor,
      },
      {
        key: "LATE",
        name: attendanceStatusConfig.LATE.label,
        value: summary.LATE,
        color: attendanceStatusConfig.LATE.chartColor,
      },
      {
        key: "EXCUSED",
        name: attendanceStatusConfig.EXCUSED.label,
        value: summary.EXCUSED,
        color: attendanceStatusConfig.EXCUSED.chartColor,
      },
      {
        key: "UNMARKED",
        name: attendanceStatusConfig.UNMARKED.label,
        value: summary.UNMARKED,
        color: attendanceStatusConfig.UNMARKED.chartColor,
      },
    ];
  })();

  const selectedDaySummary = selectedDayDistribution.reduce((summary, item) => {
    summary[item.key] = item.value;
    return summary;
  }, {});

  const summaryCards = useMemo(() => {
    const monthlySummary = board?.summary;

    if (!monthlySummary) {
      return [];
    }

    return [
      {
        label: "Attendance Rate",
        value: `${monthlySummary.attendanceRate}%`,
        detail: "Present, late, and excused against marked entries",
      },
      {
        label: "Marked Entries",
        value: String(monthlySummary.markedCount),
        detail: `${monthlySummary.notMarkedCount} slots still unmarked this month`,
      },
      {
        label: "Late Flags",
        value: String(monthlySummary.lateCount),
        detail: "Late arrivals recorded in the selected month",
      },
    ];
  }, [board?.summary]);

  function updateMonth(nextMonth) {
    setMonthValue(nextMonth);
    setSelectedDateKey(getDefaultSelectedDateKey(nextMonth));
  }

  function setStatusForStudent(student, dateKey, status) {
    const entry = getEffectiveEntry(student, dateKey);

    setPendingEdits((current) => ({
      ...current,
      [dateKey]: {
        ...(current[dateKey] || {}),
        [student.id]: {
          studentId: student.id,
          status,
          remarks: entry.remarks || "",
        },
      },
    }));
  }

  function handleCellToggle(student, dateKey) {
    setSelectedDateKey(dateKey);
    const currentStatus = getEffectiveEntry(student, dateKey).status;
    const nextStatus = getNextAttendanceStatus(currentStatus);
    setStatusForStudent(student, dateKey, nextStatus);
  }

  function markAllSelectedDayPresent() {
    if (!board?.students?.length) {
      return;
    }

    const nextEntries = board.students.reduce((entries, student) => {
      const existing = getEffectiveEntry(student, effectiveSelectedDateKey);
      entries[student.id] = {
        studentId: student.id,
        status: "PRESENT",
        remarks: existing.remarks || "",
      };
      return entries;
    }, {});

    setPendingEdits((current) => ({
      ...current,
      [effectiveSelectedDateKey]: nextEntries,
    }));

    toast.success(`All students marked present for ${resolvedDateLabel}.`);
  }

  function clearSelectedDay() {
    if (!board?.students?.length) {
      return;
    }

    const clearedEntries = board.students.reduce((entries, student) => {
      entries[student.id] = {
        studentId: student.id,
        status: null,
        remarks: "",
      };
      return entries;
    }, {});

    setPendingEdits((current) => ({
      ...current,
      [effectiveSelectedDateKey]: clearedEntries,
    }));

    toast.success(`Attendance cleared for ${resolvedDateLabel}.`);
  }

  function submitAttendanceSession() {
    if (!board?.students?.length) {
      toast.error("No active students are available for the selected class.");
      return;
    }

    saveSessionMutation.mutate({
      schoolClassId: resolvedClassId,
      academicYearId: resolvedAcademicYearId,
      termId: resolvedTermId || null,
      date: new Date(`${effectiveSelectedDateKey}T00:00:00.000Z`).toISOString(),
      entries: board.students.map((student) => {
        const entry = getEffectiveEntry(student, effectiveSelectedDateKey);
        return {
          studentId: student.id,
          status: entry.status,
          remarks: entry.remarks || null,
        };
      }),
    });
  }

  if (isInitialLoading) {
    return <AttendanceLoadingState />;
  }

  if (metaQuery.isError || boardQuery.isError) {
    return (
      <AttendanceErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          boardQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <p className="eyebrow">Attendance Operations</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
            Monthly attendance boards, daily registers, and class distribution now run on live records.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This workspace uses the selected class and month to show a full attendance matrix like a
            live register. Click cells to cycle statuses, then save the selected day when you are ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={markAllSelectedDayPresent}
              className="primary-button inline-flex items-center gap-2"
            >
              <CheckCheck size={17} />
              <span>Mark selected day present</span>
            </button>
            <button
              type="button"
              onClick={submitAttendanceSession}
              className="secondary-button inline-flex items-center gap-2"
              disabled={saveSessionMutation.isPending}
            >
              <Save size={17} />
              <span>{saveSessionMutation.isPending ? "Saving..." : "Save selected day"}</span>
            </button>
            <button type="button" onClick={clearSelectedDay} className="chip-button">
              Clear selected day
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Current Board</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                {board?.filters?.schoolClass?.label || "Class board"}
              </h2>
            </div>
            <CalendarClock className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="subtle-card rounded-[22px] p-5">
              <p className="text-sm text-[var(--ink-500)]">Selected date</p>
              <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
                {resolvedDateLabel}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Click any day header or cell to shift the active attendance register.
              </p>
            </div>

            <div className="subtle-card rounded-[22px] p-5">
              <p className="text-sm text-[var(--ink-500)]">Academic context</p>
              <p className="mt-2 font-display text-xl font-semibold text-[var(--ink-900)]">
                {board?.filters?.academicYear?.name || "Not configured"}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                {board?.filters?.term?.name || "No term filter"} / {monthValue}
              </p>
            </div>
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item, index) => (
          <motion.article
            key={item.label}
            {...getRevealMotion(reduceMotion, { y: 16, delay: 0.08 + index * 0.05 })}
            className="kpi-card rounded-[28px] p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {item.label}
            </p>
            <p className="kpi-value mt-3">{item.value}</p>
            <p className="mt-3 text-sm text-[var(--ink-700)]">{item.detail}</p>
          </motion.article>
        ))}
      </div>

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 22, delay: 0.18 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Board Filters</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
              Choose the class register you want to work on
            </h2>
          </div>
          <button type="button" onClick={() => setSearch("")} className="chip-button self-start xl:self-auto">
            Clear student search
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Academic year</span>
            <AppSelect
              value={resolvedAcademicYearId}
              onChange={(value) => {
                setSelectedAcademicYearId(value);
                setSelectedTermId("");
              }}
              options={academicYears.map((year) => ({
                value: year.id,
                label: `${year.name}${year.isActive ? " (Active)" : ""}`,
              }))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Term</span>
            <AppSelect
              value={resolvedTermId || "__NONE__"}
              onChange={(value) => setSelectedTermId(value)}
              options={[
                { value: "__NONE__", label: "All month records" },
                ...resolvedTerms.map((term) => ({
                  value: term.id,
                  label: `${term.name}${term.isActive ? " (Active)" : ""}`,
                })),
              ]}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect
              value={resolvedClassId}
              onChange={setSelectedClassId}
              options={classes.map((schoolClass) => ({
                value: schoolClass.id,
                label: schoolClass.label,
              }))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Month</span>
            <input
              type="month"
              value={monthValue}
              onChange={(event) => updateMonth(event.target.value)}
              className="form-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Student search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input"
              placeholder="Search student name or admission no..."
            />
          </label>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.22 })}
          className="surface-card overflow-hidden rounded-[30px]"
        >
          <div className="flex flex-col gap-4 border-b border-[rgba(8,39,95,0.08)] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Monthly Register</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Student attendance board
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-chip status-chip--blue">
                {filteredStudents.length} visible students
              </span>
              <span className="status-chip status-chip--cream">
                Day {boardDays.findIndex((day) => day.date === effectiveSelectedDateKey) + 1}
              </span>
            </div>
          </div>

          <div className="table-scroll-area">
            <table className="min-w-[980px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-[2] min-w-[220px] border-b border-r border-[rgba(8,39,95,0.08)] bg-[var(--brand-blue-900)] px-4 py-4 font-semibold uppercase tracking-[0.16em] text-[13px] text-[rgba(255,250,205,0.96)]">
                    Students
                  </th>
                  {boardDays.map((day) => (
                    <th
                      key={day.date}
                      className={`border-b border-[rgba(8,39,95,0.08)] px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] ${
                        day.date === effectiveSelectedDateKey
                          ? "bg-[rgba(255,250,205,0.96)] text-[var(--brand-blue-900)]"
                          : "bg-[var(--brand-blue-900)] text-[rgba(255,250,205,0.96)]"
                      }`}
                    >
                      <button
                        type="button"
                        className="flex w-full flex-col items-center justify-center"
                        onClick={() => setSelectedDateKey(day.date)}
                      >
                        <span>{day.dayNumber}</span>
                        <span className="mt-1 text-[10px] tracking-[0.12em] opacity-75">{day.weekdayShort}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="sticky left-0 z-[1] border-b border-r border-[rgba(8,39,95,0.08)] bg-white px-4 py-4 align-top shadow-[8px_0_18px_rgba(8,39,95,0.03)]">
                        <p className="font-semibold text-[var(--ink-900)]">{student.fullName}</p>
                        <p className="mt-1 text-xs text-[var(--ink-500)]">
                          Admission {student.admissionNumber}
                        </p>
                      </td>
                      {boardDays.map((day) => {
                        const entry = getEffectiveEntry(student, day.date);
                        const statusKey = entry.status || "UNMARKED";

                        return (
                          <td
                            key={`${student.id}-${day.date}`}
                            className={`border-b border-[rgba(8,39,95,0.08)] px-2 py-3 text-center ${
                              day.date === effectiveSelectedDateKey ? "bg-[rgba(248,250,252,0.96)]" : "bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCellToggle(student, day.date)}
                              title={`${student.fullName} / ${formatDateLabel(day.date)} / ${attendanceStatusConfig[statusKey].label}`}
                              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(8,39,95,0.08)] ${
                                attendanceStatusConfig[statusKey].className
                              } ${
                                day.date === effectiveSelectedDateKey
                                  ? "ring-2 ring-[rgba(8,39,95,0.12)] ring-offset-2 ring-offset-white"
                                  : ""
                              }`}
                            >
                              {attendanceStatusConfig[statusKey].shortLabel}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={boardDays.length + 1}
                      className="px-6 py-12 text-center text-sm text-[var(--ink-700)]"
                    >
                      No students matched the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-[rgba(8,39,95,0.08)] px-6 py-4 text-sm text-[var(--ink-700)]">
            {["PRESENT", "ABSENT", "LATE", "EXCUSED", "UNMARKED"].map((statusKey) => (
              <div key={statusKey} className="inline-flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${
                    attendanceStatusConfig[statusKey].className
                  }`}
                >
                  {attendanceStatusConfig[statusKey].shortLabel}
                </span>
                <span>{attendanceStatusConfig[statusKey].label}</span>
              </div>
            ))}
          </div>
        </motion.article>

        <div className="space-y-6">
          <motion.article
            {...getRevealMotion(reduceMotion, { y: 24, delay: 0.26 })}
            className="surface-card rounded-[30px] p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Distribution</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                  Selected day statistics
                </h2>
              </div>
              <PieChartIcon className="text-[var(--brand-blue-700)]" size={20} />
            </div>

            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<AttendanceChartTooltip />} />
                  <Pie
                    data={selectedDayDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={3}
                    animationDuration={reduceMotion ? 0 : 900}
                    isAnimationActive={!reduceMotion}
                  >
                    {selectedDayDistribution.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-3">
              {selectedDayDistribution.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-3">
                  <div className="inline-flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-[var(--ink-900)]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--ink-700)]">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.article
            {...getRevealMotion(reduceMotion, { y: 24, delay: 0.3 })}
            className="surface-card rounded-[30px] p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Selected Day</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                  {resolvedDateLabel}
                </h2>
              </div>
              <Clock3 className="text-[var(--brand-blue-700)]" size={20} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-sm text-[var(--ink-500)]">Present and engaged</p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
                  {(selectedDaySummary.PRESENT || 0) + (selectedDaySummary.LATE || 0) + (selectedDaySummary.EXCUSED || 0)}
                </p>
              </div>
              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-sm text-[var(--ink-500)]">Not marked yet</p>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
                  {selectedDaySummary.UNMARKED || 0}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="primary-button inline-flex items-center gap-2" onClick={submitAttendanceSession}>
                <Save size={16} />
                <span>{saveSessionMutation.isPending ? "Saving..." : "Save day"}</span>
              </button>
              <button type="button" className="secondary-button" onClick={markAllSelectedDayPresent}>
                Mark all present
              </button>
            </div>
          </motion.article>

          <motion.article
            {...getRevealMotion(reduceMotion, { y: 24, delay: 0.34 })}
            className="surface-card rounded-[30px] p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Recent Sessions</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                  Month activity
                </h2>
              </div>
              <UsersRound className="text-[var(--brand-blue-700)]" size={20} />
            </div>

            <div className="mt-6 space-y-4">
              {board?.recentSessions?.length ? (
                board.recentSessions.map((session) => (
                  <div key={session.date} className="subtle-card rounded-[24px] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                          {formatDateLabel(session.date)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--ink-700)]">
                          {session.presentCount} present / {session.absentCount} absent / {session.lateCount} late
                        </p>
                      </div>
                      <span className="status-chip status-chip--blue">{session.completionRate}%</span>
                    </div>
                    <button
                      type="button"
                      className="mt-4 chip-button"
                      onClick={() => setSelectedDateKey(session.date)}
                    >
                      Open day
                    </button>
                  </div>
                ))
              ) : (
                <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                  No attendance sessions have been saved for this month yet.
                </div>
              )}
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
