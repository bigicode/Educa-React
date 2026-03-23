import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { motion } from "motion/react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApprovals as approvals, dashboardSupportQueue as supportQueue } from "../../../data/schoolData";
import { getRevealMotion } from "../../../lib/motion";
import { EmptyStateCard, getAlertToneClass, getStatusChipClass } from "./dashboardViewUtils.jsx";

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

export function AdminDashboardView({ reduceMotion, overview, onOpenNotice }) {
  const navigate = useNavigate();
  const snapshot = overview?.snapshot;
  const attendanceAlerts = overview?.attendanceAlerts || [];
  const attendanceTrend = overview?.attendanceTrend || [];
  const recentSessions = overview?.recentSessions || [];
  const operations = overview?.operations || [];
  const communications = overview?.communications || [];
  const finance = overview?.finance;

  const overviewCards = useMemo(
    () => [
      {
        label: "Present Latest Roll Call",
        value: String(snapshot?.presentCount ?? 0),
        detail: `${snapshot?.absentCount ?? 0} absent, ${snapshot?.excusedCount ?? 0} excused`,
        icon: Users,
      },
      {
        label: "Attendance Rate",
        value: `${snapshot?.attendanceRate ?? 0}%`,
        detail: `${snapshot?.markedCount ?? 0} entries marked`,
        icon: ClipboardCheck,
      },
      {
        label: "Late Arrivals",
        value: String(snapshot?.lateCount ?? 0),
        detail: `${snapshot?.recordedClassesCount ?? 0} classes submitted`,
        icon: Coins,
      },
      {
        label: "Classes Flagged",
        value: String(attendanceAlerts.length),
        detail:
          snapshot?.notMarkedCount > 0
            ? `${snapshot.notMarkedCount} students still unmarked`
            : "All active students accounted for",
        icon: ShieldCheck,
      },
    ],
    [attendanceAlerts.length, snapshot],
  );

  const heroStats = [
    {
      label: "Latest roll call",
      value: snapshot?.date ? format(new Date(`${snapshot.date}T00:00:00`), "dd MMM") : "--",
      detail: snapshot?.dateLabel || "No attendance recorded yet",
    },
    {
      label: "Students still unmarked",
      value: String(snapshot?.notMarkedCount ?? 0),
      detail: "Remaining active students without a submitted attendance entry",
    },
    {
      label: "Recent attendance sessions",
      value: String(recentSessions.length),
      detail: "Latest submitted days recorded in the school register",
    },
  ];

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 18 })} className="surface-card-strong rounded-[30px] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Admin Dashboard</p>
              <h1 className="mt-3 page-title">School operations are now visible, not just styled.</h1>
              <p className="page-copy mt-4 max-w-2xl">
                This dashboard now shows live attendance signals, a real watchlist, and honest system readiness instead of placeholder operational numbers.
              </p>
            </div>
            <div className="surface-muted rounded-[24px] px-4 py-3 text-sm font-semibold text-[var(--ink-700)]">
              {format(new Date(), "EEEE, dd MMMM")}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Create notice",
                description: "Send one clear message to the whole school, staff, or parents.",
                icon: BellRing,
                tone: "blue",
                onClick: onOpenNotice,
              },
              {
                title: "Attendance follow-up",
                description: "Open the classes that need intervention before afternoon roll call.",
                icon: ClipboardCheck,
                tone: "cream",
                onClick: () => navigate("/dashboard/attendance"),
              },
              {
                title: "Finance workspace",
                description: "Review what is still missing before real collection analytics can go live.",
                icon: Coins,
                tone: "blue",
                onClick: () => toast("Finance analytics will activate after fee and payment tables are added."),
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
              <p className="eyebrow">Operations Today</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Priority timeline</h2>
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
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Six-week attendance stability</h2>
            </div>
            <span className="status-chip status-chip--green">{snapshot?.attendanceRate ?? 0}% latest attendance rate</span>
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
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Area type="monotone" dataKey="attendance" stroke="#0047ab" strokeWidth={3} fill="url(#attendanceFill)" isAnimationActive={!reduceMotion} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 22, delay: 0.2 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Attendance Watchlist</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">What needs attention</h2>
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
              <EmptyStateCard title="No attendance watchlist items right now" body="The latest submitted attendance sessions are within the expected range." />
            )}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.24 })} className="surface-card rounded-[30px] p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Finance</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Finance readiness</h2>
            </div>
            <span className="status-chip status-chip--cream">Honest system state</span>
          </div>
          <div className="subtle-card rounded-[24px] p-5">
            <h3 className="font-display text-xl font-semibold text-[var(--ink-900)]">{finance?.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{finance?.message}</p>
          </div>
          <div className="mt-4 space-y-4">
            {finance?.checklist?.map((item) => (
              <div key={item.label} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.detail}</p>
                  </div>
                  <span className={["status-chip", item.status === "Ready" ? "status-chip--green" : "status-chip--cream"].join(" ")}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.28 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Student Support Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Cases awaiting follow-up</h2>
            </div>
            <GraduationCap className="text-[var(--brand-blue-700)]" size={20} />
          </div>
          <div className="mt-6 space-y-4">
            {supportQueue.map((item) => (
              <div key={item.student} className="subtle-card rounded-[24px] p-5">
                <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{item.student}</p>
                <p className="mt-2 text-sm text-[var(--ink-700)]">{item.issue}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="status-chip status-chip--blue">{item.owner}</span>
                  <button type="button" className="chip-button" onClick={() => navigate("/dashboard/students")}>
                    Open case
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.32 })} className="surface-card rounded-[30px] p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Pending Approvals</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Decisions that need sign-off</h2>
            </div>
            <button type="button" className="chip-button" onClick={() => toast.success("Approval board opened.")}>Open board</button>
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
                      <span className={["status-chip", row.status === "Priority" ? "status-chip--rose" : row.status === "Pending" ? "status-chip--cream" : "status-chip--blue"].join(" ")}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.article>

        <motion.article {...getRevealMotion(reduceMotion, { y: 24, delay: 0.36 })} className="surface-card rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Communication</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">Operational communication</h2>
            </div>
            <MessageSquareMore className="text-[var(--brand-blue-700)]" size={20} />
          </div>
          <div className="mt-6 space-y-4">
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
              <EmptyStateCard title="No communication signals yet" body="Operational communication summaries will appear here as attendance and academic activity grows." />
            )}
          </div>
        </motion.article>
      </div>
    </>
  );
}
