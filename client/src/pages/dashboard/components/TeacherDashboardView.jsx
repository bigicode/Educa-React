import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  MessageSquareMore,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getRevealMotion } from "../../../lib/motion";
import { EmptyStateCard } from "./EmptyStateCard.jsx";
import { formatDashboardDateLabel, getAlertToneClass, getStatusChipClass } from "./dashboardViewHelpers.js";

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[rgba(8,39,95,0.12)] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(8,39,95,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue-700)]">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
        {payload[0].value}
        {suffix}
      </p>
    </div>
  );
}

export function TeacherDashboardView({ reduceMotion, overview }) {
  const navigate = useNavigate();
  const snapshot = overview?.snapshot;
  const attendanceAlerts = overview?.attendanceAlerts || [];
  const attendanceTrend = overview?.attendanceTrend || [];
  const recentSessions = overview?.recentSessions || [];
  const operations = overview?.operations || [];
  const communications = overview?.communications || [];
  const teacherProfile = overview?.teacher;
  const teacherSummary = overview?.teacherSummary;
  const recentAssessments = overview?.recentAssessments || [];

  const overviewCards = useMemo(() => {
    const subjectPreview =
      teacherProfile?.subjects?.slice(0, 2).map((subject) => subject.code).join(", ") ||
      "No subject ownership yet";

    return [
      {
        label: "Assigned Classes",
        value: String(teacherSummary?.assignedClassesCount ?? 0),
        detail: `${teacherProfile?.homeroomClasses?.length ?? 0} homeroom class(es)`,
        icon: Users,
      },
      {
        label: "Active Students",
        value: String(teacherSummary?.activeStudentsCount ?? 0),
        detail: `${snapshot?.attendanceRate ?? 0}% latest attendance rate`,
        icon: ClipboardCheck,
      },
      {
        label: "Subjects",
        value: String(teacherSummary?.subjectCount ?? 0),
        detail: subjectPreview,
        icon: GraduationCap,
      },
      {
        label: "Draft Assessments",
        value: String(teacherSummary?.draftAssessmentsCount ?? 0),
        detail: `${teacherSummary?.publishedAssessmentsCount ?? 0} published so far`,
        icon: ShieldCheck,
      },
    ];
  }, [snapshot, teacherProfile, teacherSummary]);

  const heroStats = [
    {
      label: "Homeroom classes",
      value: String(teacherProfile?.homeroomClasses?.length ?? 0),
      detail: "Teacher-owned homeroom responsibilities",
    },
    {
      label: "Assigned classes",
      value: String(teacherProfile?.assignedClasses?.length ?? 0),
      detail: "Classes linked to your subject ownership",
    },
    {
      label: "Recent assessments",
      value: String(recentAssessments.length),
      detail: "Latest draft, scheduled, and published assessments",
    },
  ];

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 18 })} className="surface-card-strong rounded-[30px] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Teacher Dashboard</p>
              <h1 className="mt-3 page-title">Teaching operations are now organized around your classes.</h1>
              <p className="page-copy mt-4 max-w-2xl">
                Track attendance, review class follow-up, and keep assessments moving from one workspace built around your teaching ownership.
              </p>
            </div>
            <div className="surface-muted rounded-[24px] px-4 py-3 text-sm font-semibold text-[var(--ink-700)]">
              {format(new Date(), "EEEE, dd MMMM")}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Open attendance register",
                description: "Go straight to the monthly register for your assigned classes.",
                icon: ClipboardCheck,
                tone: "blue",
                onClick: () => navigate("/dashboard/attendance"),
              },
              {
                title: "Create assessment",
                description: "Prepare quizzes, CATs, and exams for the classes you own.",
                icon: GraduationCap,
                tone: "cream",
                onClick: () => navigate("/dashboard/assessments"),
              },
              {
                title: "Open communication",
                description: "Review school notices and class follow-up updates in one place.",
                icon: MessageSquareMore,
                tone: "blue",
                onClick: () => navigate("/dashboard/communication"),
              },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <button type="button" key={tile.title} onClick={tile.onClick} className="action-tile text-left">
                  <div className={["mb-4 inline-flex rounded-2xl p-3", tile.tone === "cream" ? "bg-[rgba(255,250,205,0.72)] text-[var(--brand-blue-900)]" : "bg-[var(--brand-blue-50)] text-[var(--brand-blue-700)]"].join(" ")}>
                    <Icon size={18} />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[var(--ink-900)]">{tile.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{tile.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {heroStats.map((item) => (
              <div key={item.label} className="mini-stat">
                <p className="text-sm text-[var(--ink-700)]">{item.label}</p>
                <p className="mt-2 font-display text-3xl font-bold text-[var(--ink-900)]">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--ink-700)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Teaching Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Your priority timeline</h2>
            </div>
            <CalendarDays className="text-[var(--brand-blue-700)]" size={20} />
          </div>
          <div className="mt-6 space-y-4">
            {operations.map((task) => (
              <div key={`${task.title}-${task.time}`} className="subtle-card rounded-[24px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{task.title}</p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">{task.time}</p>
                  </div>
                  <span className={["status-chip", getStatusChipClass(task.status)].join(" ")}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article key={card.label} {...getRevealMotion(reduceMotion, { y: 16, delay: 0.08 + index * 0.05 })} className="kpi-card rounded-[28px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">{card.label}</p>
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

      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.92fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 22, delay: 0.16 })} className="surface-card rounded-[30px] p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Attendance across your classes</h2>
            </div>
            <span className="status-chip status-chip--green">{snapshot?.attendanceRate ?? 0}% latest attendance rate</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="teacherAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0047ab" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#0047ab" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(8,39,95,0.08)" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area type="monotone" dataKey="attendance" stroke="#0047ab" strokeWidth={3} fill="url(#teacherAttendanceFill)" isAnimationActive={!reduceMotion} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 22, delay: 0.2 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Class Watchlist</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Classes that need follow-up</h2>
            </div>
            <AlertTriangle className="text-[var(--brand-blue-700)]" size={20} />
          </div>
          <div className="mt-6 space-y-4">
            {attendanceAlerts.length ? (
              attendanceAlerts.map((alert) => (
                <div key={alert.title} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{alert.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{alert.detail}</p>
                    </div>
                    <span className={["status-chip", getAlertToneClass(alert.tone)].join(" ")}>{alert.tone === "rose" ? "Urgent" : alert.tone === "cream" ? "Follow-up" : "Monitor"}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard title="Your classes are steady right now" body="The latest attendance sessions in your classes are within the expected range." />
            )}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.24 })} className="surface-card rounded-[30px] p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Assessments</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Assessment pipeline</h2>
            </div>
            <button type="button" className="chip-button" onClick={() => navigate("/dashboard/assessments")}>Open assessments</button>
          </div>
          <div className="space-y-4">
            {recentAssessments.length ? (
              recentAssessments.map((assessment) => (
                <div key={assessment.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{assessment.title}</p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">{assessment.subjectName} for {assessment.classLabel}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Due {formatDashboardDateLabel(assessment.dueDate)}</p>
                    </div>
                    <span className={["status-chip", getStatusChipClass(assessment.status)].join(" ")}>{assessment.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard title="No assessments assigned yet" body="Once you create or own assessments, they will show up here with due dates and publishing status." />
            )}
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.28 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Recent Attendance Sessions</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Latest class submissions</h2>
            </div>
            <CalendarDays className="text-[var(--brand-blue-700)]" size={20} />
          </div>
          <div className="mt-6 space-y-4">
            {recentSessions.length ? (
              recentSessions.map((session) => (
                <div key={session.date} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{session.label}</p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">{session.classesCount} classes submitted with {session.attendanceRate}% attendance</p>
                    </div>
                    <span className="status-chip status-chip--blue">{session.absentCount} absent</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard title="No class sessions submitted yet" body="Attendance sessions will appear here after you or your assigned classes begin submitting register entries." />
            )}
          </div>
        </motion.article>
      </div>

      <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.32 })} className="surface-card rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Communication</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Teaching communication feed</h2>
          </div>
          <MessageSquareMore className="text-[var(--brand-blue-700)]" size={20} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {communications.length ? (
            communications.map((item) => (
              <div key={`${item.title}-${item.time}`} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.body}</p>
                  </div>
                  <ArrowUpRight size={18} className="mt-1 text-[var(--brand-blue-700)]" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">{item.time}</p>
              </div>
            ))
          ) : (
            <EmptyStateCard title="No communication signals yet" body="As attendance and assessment activity grows, follow-up communication cues will surface here." />
          )}
        </div>
      </motion.article>
    </>
  );
}
