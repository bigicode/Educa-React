import { useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ClipboardCheck,
  Coins,
  GraduationCap,
  MessageSquareMore,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppSelect } from "../../components/ui/AppSelect";
import { ModalShell } from "../../components/ui/ModalShell";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  dashboardAlerts as alerts,
  dashboardApprovals as approvals,
  dashboardCommunications as communications,
  dashboardSupportQueue as supportQueue,
} from "../../data/schoolData";
import { useDemoLoading } from "../../hooks/useDemoLoading";
import { getRevealMotion } from "../../lib/motion";

const overviewCards = [
  {
    label: "Present Today",
    value: "1,182",
    detail: "66 absent, 23 excused",
    icon: Users,
  },
  {
    label: "Pending Approvals",
    value: "14",
    detail: "Admissions, transfer, leave",
    icon: ClipboardCheck,
  },
  {
    label: "Fee Collection",
    value: "TZS 42.6M",
    detail: "83% of monthly target",
    icon: Coins,
  },
  {
    label: "Open Incidents",
    value: "5",
    detail: "Attendance and transport",
    icon: ShieldCheck,
  },
];

const attendanceTrend = [
  { week: "W1", attendance: 91, absent: 9 },
  { week: "W2", attendance: 92, absent: 8 },
  { week: "W3", attendance: 93, absent: 7 },
  { week: "W4", attendance: 94, absent: 6 },
  { week: "W5", attendance: 95, absent: 5 },
  { week: "W6", attendance: 94, absent: 6 },
];

const feeCollections = [
  { month: "Jan", amount: 36 },
  { month: "Feb", amount: 38 },
  { month: "Mar", amount: 41 },
  { month: "Apr", amount: 42.6 },
];

const operationsToday = [
  { title: "Morning assembly brief", time: "07:45", status: "Ready" },
  { title: "Boarding attendance review", time: "09:20", status: "In progress" },
  { title: "Parents finance follow-up", time: "11:00", status: "Priority" },
  { title: "Teacher moderation meeting", time: "14:30", status: "Scheduled" },
];

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

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-32 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-3/4 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
          </div>
        </div>

        <CardSkeleton className="rounded-[30px]" lines={5} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="surface-card rounded-[30px] p-6">
          <SkeletonBlock className="mb-4 h-4 w-36 rounded-full" />
          <SkeletonBlock className="mb-6 h-8 w-64 rounded-2xl" />
          <SkeletonBlock className="h-[280px] rounded-[26px]" />
        </div>
        <div className="surface-card rounded-[30px] p-6">
          <SkeletonBlock className="mb-4 h-4 w-28 rounded-full" />
          <SkeletonBlock className="mb-6 h-8 w-56 rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="subtle-card rounded-[24px] p-5">
                <SkeletonBlock className="mb-3 h-4 w-2/3 rounded-full" />
                <SkeletonText lines={2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TableSkeleton />
    </div>
  );
}

export function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const isLoading = useDemoLoading("dashboard", 900);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    audience: "All School",
    title: "",
    message: "",
  });

  function updateNotice(field, value) {
    setNoticeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitNotice() {
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      toast.error("Add both a subject and a message before sending.");
      return;
    }

    toast.success(`Notice prepared for ${noticeForm.audience.toLowerCase()}.`);
    setIsNoticeOpen(false);
    setNoticeForm({
      audience: "All School",
      title: "",
      message: "",
    });
  }

  function sendReminder() {
    toast.success("Fee reminder batch scheduled for finance follow-up.");
  }

  function logAttendanceAction() {
    toast.success("Attendance intervention queue opened.");
  }

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Admin Dashboard</p>
              <h1 className="mt-3 page-title">School operations are now visible, not just styled.</h1>
              <p className="page-copy mt-4 max-w-2xl">
                This dashboard now shows the kind of information a school administrator actually
                needs at a glance: attendance, approvals, finance follow-up, staff coordination,
                and urgent actions.
              </p>
            </div>

            <div className="surface-muted rounded-[24px] px-4 py-3 text-sm font-semibold text-[var(--ink-700)]">
              Monday, 22 March
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <button type="button" onClick={() => setIsNoticeOpen(true)} className="action-tile text-left">
              <div className="mb-4 inline-flex rounded-2xl bg-[var(--brand-blue-50)] p-3 text-[var(--brand-blue-700)]">
                <BellRing size={18} />
              </div>
              <h2 className="font-display text-lg font-semibold text-[var(--ink-900)]">Create notice</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Send one clear message to the whole school, staff, or parents.
              </p>
            </button>

            <button type="button" onClick={logAttendanceAction} className="action-tile text-left">
              <div className="mb-4 inline-flex rounded-2xl bg-[rgba(255,250,205,0.72)] p-3 text-[var(--brand-blue-900)]">
                <ClipboardCheck size={18} />
              </div>
              <h2 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                Attendance follow-up
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Open the classes that need intervention before afternoon roll call.
              </p>
            </button>

            <button type="button" onClick={sendReminder} className="action-tile text-left">
              <div className="mb-4 inline-flex rounded-2xl bg-[var(--brand-blue-50)] p-3 text-[var(--brand-blue-700)]">
                <Coins size={18} />
              </div>
              <h2 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                Finance reminder
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Trigger the next round of fee reminders from the operations panel.
              </p>
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="mini-stat">
              <p className="text-sm text-[var(--ink-700)]">Admissions today</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--ink-900)]">08</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">3 pending document review</p>
            </div>
            <div className="mini-stat">
              <p className="text-sm text-[var(--ink-700)]">Parents to call</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--ink-900)]">17</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">Finance and attendance follow-up</p>
            </div>
            <div className="mini-stat">
              <p className="text-sm text-[var(--ink-700)]">Staff on duty</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--ink-900)]">86</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">2 substitutes assigned today</p>
            </div>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Operations Today</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Priority timeline
              </h2>
            </div>
            <CalendarDays className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {operationsToday.map((task) => (
              <div key={task.title} className="subtle-card rounded-[24px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {task.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">{task.time}</p>
                  </div>
                  <span
                    className={[
                      "status-chip",
                      task.status === "Priority"
                        ? "status-chip--rose"
                        : task.status === "In progress"
                          ? "status-chip--blue"
                          : "status-chip--cream",
                    ].join(" ")}
                  >
                    {task.status}
                  </span>
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
            <motion.article
              key={card.label}
              {...getRevealMotion(reduceMotion, { y: 16, delay: 0.08 + index * 0.05 })}
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

      <div className="grid gap-6 xl:grid-cols-[1.28fr_0.92fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.16 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Six-week attendance stability
              </h2>
            </div>
            <span className="status-chip status-chip--green">Improving trend</span>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0047ab" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#0047ab" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(8,39,95,0.08)" vertical={false} />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#0047ab"
                  strokeWidth={3}
                  fill="url(#attendanceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.2 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Alerts</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                What needs attention
              </h2>
            </div>
            <AlertTriangle className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {alerts.map((alert) => (
              <div key={alert.title} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {alert.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{alert.detail}</p>
                  </div>
                  <span
                    className={[
                      "status-chip",
                      alert.tone === "rose"
                        ? "status-chip--rose"
                        : alert.tone === "cream"
                          ? "status-chip--cream"
                          : "status-chip--blue",
                    ].join(" ")}
                  >
                    {alert.tone === "rose" ? "Urgent" : alert.tone === "cream" ? "Follow-up" : "Monitor"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.24 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Finance</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Monthly fee collection
              </h2>
            </div>
            <span className="status-chip status-chip--cream">April target 83%</span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeCollections} barGap={16}>
                <CartesianGrid stroke="rgba(8,39,95,0.08)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip suffix="M" />} />
                <Bar dataKey="amount" fill="#08275f" radius={[12, 12, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.28 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Student Support Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Cases awaiting follow-up
              </h2>
            </div>
            <GraduationCap className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {supportQueue.map((item) => (
              <div key={item.student} className="subtle-card rounded-[24px] p-5">
                <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                  {item.student}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-700)]">{item.issue}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="status-chip status-chip--blue">{item.owner}</span>
                  <button type="button" className="chip-button" onClick={logAttendanceAction}>
                    Open case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.32 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Pending Approvals</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Decisions that need sign-off
              </h2>
            </div>
            <button type="button" className="chip-button" onClick={() => toast.success("Approval board opened.")}>
              Open board
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((row) => (
                  <tr key={row.item}>
                    <td className="font-semibold text-[var(--ink-900)]">{row.item}</td>
                    <td>{row.owner}</td>
                    <td>{row.due}</td>
                    <td>
                      <span
                        className={[
                          "status-chip",
                          row.status === "Priority"
                            ? "status-chip--rose"
                            : row.status === "Pending"
                              ? "status-chip--cream"
                              : "status-chip--blue",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.36 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Recent Communication</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Messages and automations
              </h2>
            </div>
            <MessageSquareMore className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {communications.map((item) => (
              <div key={item.title} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.body}</p>
                  </div>
                  <ArrowUpRight size={18} className="mt-1 text-[var(--brand-blue-700)]" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        title="Create school notice"
        description="Use this for announcements that need a quick but structured message workflow."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setIsNoticeOpen(false)}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={submitNotice}>
              Send notice
            </button>
          </>
        }
      >
        <div className="grid gap-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Audience</span>
            <AppSelect
              value={noticeForm.audience}
              onChange={(value) => updateNotice("audience", value)}
              options={["All School", "Teachers", "Parents", "Students"]}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <input
              value={noticeForm.title}
              onChange={(event) => updateNotice("title", event.target.value)}
              className="form-input"
              placeholder="Example: Midterm timetable update"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Message</span>
            <textarea
              value={noticeForm.message}
              onChange={(event) => updateNotice("message", event.target.value)}
              className="form-input min-h-36 resize-none"
              placeholder="Write the announcement that will appear on the dashboard and notifications."
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
