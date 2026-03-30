import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  BarChart3,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppSelect } from "../../components/ui/AppSelect";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../features/auth/useAuth";
import { fetchReportsMeta, fetchReportsOverview, getApiErrorMessage } from "../../features/reports/api";
import { getRevealMotion } from "../../lib/motion";

const assessmentStatusColors = {
  DRAFT: "#f59e0b",
  SCHEDULED: "#0047ab",
  OPEN: "#0f766e",
  CLOSED: "#64748b",
  PUBLISHED: "#16a34a",
};

function formatDateLabel(value) {
  if (!value) {
    return "Not scheduled";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not scheduled";
  }

  return format(parsedDate, "dd MMM yyyy");
}

function buildCsv(columns, rows) {
  const header = columns.map((column) => `"${column.label.replace(/"/g, '""')}"`).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const rawValue = typeof column.value === "function" ? column.value(row) : row[column.key];
        return `"${String(rawValue ?? "").replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  return [header, ...body].join("\n");
}

function downloadCsv(filename, columns, rows) {
  if (!rows.length) {
    toast.error("There is no data to export for this report.");
    return;
  }

  const csvContent = buildCsv(columns, rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[rgba(8,39,95,0.12)] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(8,39,95,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue-700)]">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
        {payload[0].value}
        {suffix}
      </p>
    </div>
  );
}

function ReportsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-32 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-2/3 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
        </div>
        <CardSkeleton className="rounded-[30px]" lines={4} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <CardSkeleton className="rounded-[30px]" lines={5} />
        <CardSkeleton className="rounded-[30px]" lines={5} />
      </div>
      <TableSkeleton />
    </div>
  );
}

function ReportsErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Reports</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
        The reports workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-8" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function EmptyStateCard({ title, body }) {
  return (
    <div className="subtle-card rounded-[24px] p-5">
      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{body}</p>
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("ALL");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const metaQuery = useQuery({
    queryKey: ["reports", "meta"],
    queryFn: fetchReportsMeta,
  });

  const academicYears = metaQuery.data?.academicYears || [];
  const classes = metaQuery.data?.classes || [];
  const subjects = metaQuery.data?.subjects || [];
  const resolvedAcademicYearId = selectedAcademicYearId || academicYears[0]?.id || "";
  const resolvedAcademicYear = academicYears.find((year) => year.id === resolvedAcademicYearId) || null;
  const termOptions = resolvedAcademicYear?.terms || [];

  const overviewQuery = useQuery({
    queryKey: [
      "reports",
      "overview",
      resolvedAcademicYearId,
      selectedTermId,
      selectedClassId,
      selectedSubjectId,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchReportsOverview({
        ...(resolvedAcademicYearId ? { academicYearId: resolvedAcademicYearId } : {}),
        ...(selectedTermId !== "ALL" ? { termId: selectedTermId } : {}),
        ...(selectedClassId !== "ALL" ? { schoolClassId: selectedClassId } : {}),
        ...(selectedSubjectId !== "ALL" ? { subjectId: selectedSubjectId } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      }),
    enabled: Boolean(resolvedAcademicYearId),
  });

  const overview = overviewQuery.data;
  const scope = overview?.scope || metaQuery.data?.scope || user?.roleKey || "SUPER_ADMIN";
  const isTeacher = scope === "TEACHER";
  const searchValue = deferredSearch.trim().toLowerCase();

  const attendanceRows = useMemo(() => {
    const rows = overview?.attendanceRows || [];

    if (!searchValue) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.fullName.toLowerCase().includes(searchValue) ||
        row.admissionNumber.toLowerCase().includes(searchValue) ||
        row.classLabel.toLowerCase().includes(searchValue),
    );
  }, [overview?.attendanceRows, searchValue]);

  const assessmentRows = useMemo(() => {
    const rows = overview?.assessmentRows || [];

    if (!searchValue) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.title.toLowerCase().includes(searchValue) ||
        row.subjectName.toLowerCase().includes(searchValue) ||
        row.classLabel.toLowerCase().includes(searchValue) ||
        row.status.toLowerCase().includes(searchValue),
    );
  }, [overview?.assessmentRows, searchValue]);

  const teacherRows = useMemo(() => {
    const rows = overview?.teacherRows || [];

    if (!searchValue) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.fullName.toLowerCase().includes(searchValue) ||
        row.employeeCode.toLowerCase().includes(searchValue),
    );
  }, [overview?.teacherRows, searchValue]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Attendance Rate",
        value: `${overview?.summary?.attendanceRate ?? 0}%`,
        detail: `${overview?.summary?.markedEntries ?? 0} marked entries`,
        icon: ClipboardCheck,
      },
      {
        label: "Students In Scope",
        value: String(overview?.summary?.totalStudents ?? 0),
        detail: isTeacher ? "Students in your current reporting scope" : "Active students in the selected scope",
        icon: UsersRound,
      },
      {
        label: "Published Assessments",
        value: String(overview?.summary?.publishedAssessments ?? 0),
        detail: `${overview?.summary?.draftAssessments ?? 0} draft assessments`,
        icon: GraduationCap,
      },
      {
        label: "Average Marks",
        value: String(overview?.summary?.averageMarks ?? 0),
        detail: `${overview?.summary?.teacherRowsCount ?? 0} workload row(s) represented`,
        icon: FileSpreadsheet,
      },
    ],
    [isTeacher, overview],
  );

  const overviewErrorMessage = useMemo(
    () =>
      getApiErrorMessage(
        overviewQuery.error || metaQuery.error,
        "Check the backend connection and make sure reports data is available.",
      ),
    [metaQuery.error, overviewQuery.error],
  );

  const attendanceExportColumns = [
    { label: "Student", value: (row) => row.fullName },
    { label: "Admission No", value: (row) => row.admissionNumber },
    { label: "Class", value: (row) => row.classLabel },
    { label: "Present", value: (row) => row.presentCount },
    { label: "Absent", value: (row) => row.absentCount },
    { label: "Late", value: (row) => row.lateCount },
    { label: "Excused", value: (row) => row.excusedCount },
    { label: "Attendance Rate", value: (row) => `${row.attendanceRate}%` },
  ];

  const assessmentExportColumns = [
    { label: "Title", value: (row) => row.title },
    { label: "Subject", value: (row) => row.subjectName },
    { label: "Class", value: (row) => row.classLabel },
    { label: "Status", value: (row) => row.status },
    { label: "Due Date", value: (row) => formatDateLabel(row.dueDate) },
    { label: "Graded Entries", value: (row) => row.gradedEntries },
    { label: "Average Marks", value: (row) => row.averageMarks },
    { label: "Assigned By", value: (row) => row.assignedBy },
  ];

  const teacherExportColumns = [
    { label: "Teacher", value: (row) => row.fullName },
    { label: "Employee Code", value: (row) => row.employeeCode },
    { label: "Classes Owned", value: (row) => row.classesOwned },
    { label: "Subject Assignments", value: (row) => row.subjectAssignments },
    { label: "Assessments Created", value: (row) => row.assessmentsCreated },
    { label: "Attendance Entries", value: (row) => row.attendanceEntries },
  ];

  if (metaQuery.isLoading || overviewQuery.isLoading) {
    return <ReportsLoadingState />;
  }

  if (metaQuery.isError || overviewQuery.isError) {
    return <ReportsErrorState message={overviewErrorMessage} onRetry={() => {
      metaQuery.refetch();
      overviewQuery.refetch();
    }} />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Reports</p>
              <h1 className="mt-3 page-title">
                Attendance, assessments, and workload are now reportable from live school data.
              </h1>
              <p className="page-copy mt-4 max-w-2xl">
                {isTeacher
                  ? "Use this space to review your class attendance, assessment progress, and teaching workload without leaving the reporting flow."
                  : "This workspace turns the live modules into operational reports, exportable tables, and chart-ready summaries for school leadership."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  downloadCsv(
                    `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
                    attendanceExportColumns,
                    attendanceRows,
                  )
                }
              >
                <Download size={16} />
                Export attendance
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  downloadCsv(
                    `assessment-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
                    assessmentExportColumns,
                    assessmentRows,
                  )
                }
              >
                <Download size={16} />
                Export assessments
              </button>
            </div>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Reporting Scope</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Current report frame
              </h2>
            </div>
            <BarChart3 className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="subtle-card rounded-[24px] p-5">
              <p className="text-sm text-[var(--ink-700)]">Academic year</p>
              <p className="mt-2 font-display text-xl font-semibold text-[var(--ink-900)]">
                {resolvedAcademicYear?.name || "Not selected"}
              </p>
            </div>
            <div className="subtle-card rounded-[24px] p-5">
              <p className="text-sm text-[var(--ink-700)]">Term</p>
              <p className="mt-2 font-display text-xl font-semibold text-[var(--ink-900)]">
                {overview?.filters?.term?.name || "All terms / active scope"}
              </p>
            </div>
            <div className="subtle-card rounded-[24px] p-5">
              <p className="text-sm text-[var(--ink-700)]">Role view</p>
              <p className="mt-2 font-display text-xl font-semibold text-[var(--ink-900)]">
                {isTeacher ? "Teacher report scope" : "Admin report scope"}
              </p>
            </div>
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.label}
              {...getRevealMotion(reduceMotion, { y: 16, delay: 0.06 + index * 0.05 })}
              className="kpi-card rounded-[28px] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                    {card.label}
                  </p>
                  <p className="kpi-value mt-3">{card.value}</p>
                  <p className="mt-3 text-sm text-[var(--ink-700)]">{card.detail}</p>
                </div>
                <div className="rounded-2xl bg-[var(--brand-blue-50)] p-3 text-[var(--brand-blue-700)]">
                  <Icon size={18} />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 20, delay: 0.14 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr_auto]">
          <label className="form-field">
            <span className="form-label">Search reports</span>
            <input
              className="form-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students, assessments, teachers..."
            />
          </label>

          <label className="form-field">
            <span className="form-label">Academic year</span>
            <AppSelect
              value={resolvedAcademicYearId}
              onChange={(value) => {
                setSelectedAcademicYearId(value);
                setSelectedTermId("ALL");
              }}
              options={academicYears.map((year) => ({
                value: year.id,
                label: year.name,
              }))}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Term</span>
            <AppSelect
              value={selectedTermId}
              onChange={setSelectedTermId}
              options={[
                { value: "ALL", label: "All / active term" },
                ...termOptions.map((term) => ({
                  value: term.id,
                  label: term.name,
                })),
              ]}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Class</span>
            <AppSelect
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={[
                { value: "ALL", label: "All classes" },
                ...classes.map((schoolClass) => ({
                  value: schoolClass.id,
                  label: schoolClass.label,
                })),
              ]}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Subject</span>
            <AppSelect
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
              options={[
                { value: "ALL", label: "All subjects" },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.code} - ${subject.name}`,
                })),
              ]}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="form-field">
              <span className="form-label">From</span>
              <input className="form-input" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className="form-field">
              <span className="form-label">To</span>
              <input className="form-input" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </label>
          </div>

          <button
            type="button"
            className="secondary-button mt-auto"
            onClick={() => {
              setSelectedTermId("ALL");
              setSelectedClassId("ALL");
              setSelectedSubjectId("ALL");
              setDateFrom("");
              setDateTo("");
              setSearch("");
            }}
          >
            Reset
          </button>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 20, delay: 0.18 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Attendance By Class</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Class attendance distribution
              </h2>
            </div>
            <span className="status-chip status-chip--blue">{overview?.attendanceByClass?.length || 0} classes</span>
          </div>

          {overview?.attendanceByClass?.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.attendanceByClass}>
                  <CartesianGrid stroke="rgba(8,39,95,0.08)" vertical={false} />
                  <XAxis dataKey="classLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip suffix="%" />} />
                  <Bar
                    dataKey="attendanceRate"
                    radius={[12, 12, 4, 4]}
                    fill="#0047ab"
                    isAnimationActive={!reduceMotion}
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyStateCard
              title="No attendance chart data yet"
              body="Attendance records will appear here once the selected scope has marked entries."
            />
          )}
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 20, delay: 0.22 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Assessment Status</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Assessment distribution
              </h2>
            </div>
            <span className="status-chip status-chip--cream">{overview?.assessmentStatus?.length || 0} statuses</span>
          </div>

          {overview?.assessmentStatus?.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.assessmentStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={78}
                    outerRadius={116}
                    paddingAngle={3}
                    isAnimationActive={!reduceMotion}
                    animationDuration={900}
                  >
                    {overview.assessmentStatus.map((entry) => (
                      <Cell key={entry.status} fill={assessmentStatusColors[entry.status] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyStateCard
              title="No assessment distribution yet"
              body="Assessment statuses will appear here when the selected report scope contains academic records."
            />
          )}
        </motion.article>
      </div>

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 22, delay: 0.26 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Attendance Report</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
              Student attendance summary
            </h2>
          </div>
          <button
            type="button"
            className="chip-button"
            onClick={() =>
              downloadCsv(
                `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
                attendanceExportColumns,
                attendanceRows,
              )
            }
          >
            Export CSV
          </button>
        </div>

        {attendanceRows.length ? (
          <div className="overflow-x-auto">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Excused</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((row) => (
                  <tr key={row.studentId}>
                    <td>
                      <div className="font-semibold text-[var(--ink-900)]">{row.fullName}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                        {row.admissionNumber}
                      </div>
                    </td>
                    <td>{row.classLabel}</td>
                    <td>{row.presentCount}</td>
                    <td>{row.absentCount}</td>
                    <td>{row.lateCount}</td>
                    <td>{row.excusedCount}</td>
                    <td>
                      <span className="status-chip status-chip--green">{row.attendanceRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateCard
            title="No attendance rows match this scope"
            body="Adjust the filters or wait for attendance records to be submitted for the selected period."
          />
        )}
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.3 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Assessment Report</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Assessment completion and grading
              </h2>
            </div>
            <button
              type="button"
              className="chip-button"
              onClick={() =>
                downloadCsv(
                  `assessment-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
                  assessmentExportColumns,
                  assessmentRows,
                )
              }
            >
              Export CSV
            </button>
          </div>

          {assessmentRows.length ? (
            <div className="overflow-x-auto">
              <table className="table-shell min-w-full text-left">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Graded</th>
                    <th>Avg</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="font-semibold text-[var(--ink-900)]">{row.title}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                          {row.subjectCode} · {row.subjectName}
                        </div>
                      </td>
                      <td>{row.classLabel}</td>
                      <td>
                        <span
                          className={[
                            "status-chip",
                            row.status === "PUBLISHED"
                              ? "status-chip--green"
                              : row.status === "DRAFT"
                                ? "status-chip--cream"
                                : "status-chip--blue",
                          ].join(" ")}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.gradedEntries}</td>
                      <td>{row.averageMarks}</td>
                      <td>{formatDateLabel(row.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCard
              title="No assessments match this scope"
              body="Adjust the class, term, or subject filters to review academic reporting."
            />
          )}
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.34 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">{isTeacher ? "Your Workload" : "Teacher Workload"}</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                {isTeacher ? "Teaching workload snapshot" : "Reporting by teacher ownership"}
              </h2>
            </div>
            <button
              type="button"
              className="chip-button"
              onClick={() =>
                downloadCsv(
                  `teacher-report-${format(new Date(), "yyyy-MM-dd")}.csv`,
                  teacherExportColumns,
                  teacherRows,
                )
              }
            >
              Export CSV
            </button>
          </div>

          {teacherRows.length ? (
            <div className="overflow-x-auto">
              <table className="table-shell min-w-full text-left">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Classes</th>
                    <th>Subjects</th>
                    <th>Assessments</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRows.map((row) => (
                    <tr key={row.teacherId}>
                      <td>
                        <div className="font-semibold text-[var(--ink-900)]">{row.fullName}</div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                          {row.employeeCode}
                        </div>
                      </td>
                      <td>{row.classesOwned}</td>
                      <td>{row.subjectAssignments}</td>
                      <td>{row.assessmentsCreated}</td>
                      <td>{row.attendanceEntries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCard
              title="No teacher workload rows available"
              body="Teacher workload will appear here once staff ownership and activity exist within the selected scope."
            />
          )}
        </motion.article>
      </div>
    </section>
  );
}
