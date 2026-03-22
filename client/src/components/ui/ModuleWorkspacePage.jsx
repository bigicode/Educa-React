import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { getRevealMotion } from "../../lib/motion";

export function ModuleWorkspacePage({
  eyebrow,
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
  stats,
  focusTitle,
  focusItems,
  checklistTitle,
  checklistItems,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">{title}</h1>
          <p className="page-copy mt-4 max-w-3xl">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="primary-button inline-flex items-center gap-2"
              onClick={() => toast.success(`${primaryActionLabel} is ready for the next implementation slice.`)}
            >
              <ArrowUpRight size={17} />
              <span>{primaryActionLabel}</span>
            </button>
            <button
              type="button"
              className="secondary-button inline-flex items-center gap-2"
              onClick={() => toast.success(`${secondaryActionLabel} is queued next.`)}
            >
              <span>{secondaryActionLabel}</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <p className="eyebrow">{focusTitle}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
            Current implementation focus
          </h2>

          <div className="mt-6 space-y-4">
            {focusItems.map((item) => (
              <div key={item.title} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.description}</p>
                  </div>
                  <span className="status-chip status-chip--blue">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item, index) => (
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

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.16 })}
          className="surface-card rounded-[30px] p-6"
        >
          <p className="eyebrow">{checklistTitle}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
            Delivery checklist
          </h2>

          <div className="mt-6 space-y-4">
            {checklistItems.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-[22px] border border-[rgba(8,39,95,0.08)] bg-white/90 p-5"
              >
                <CheckCircle2 className="mt-1 text-[var(--brand-blue-700)]" size={18} />
                <div>
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.22 })}
          className="surface-card rounded-[30px] p-6"
        >
          <p className="eyebrow">Implementation Note</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
            This module is now part of the real build plan
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ink-700)]">
            The page, navigation slot, route, and search entry are now established. The next step is
            wiring each module to real API endpoints and Prisma models instead of demo state.
          </p>

          <div className="mt-6 space-y-3">
            <div className="accent-panel rounded-[22px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue-700)]">
                Backend next
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Prisma schema, controllers, services, and seeded data.
              </p>
            </div>
            <div className="subtle-card rounded-[22px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue-700)]">
                Frontend next
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Replace placeholder cards with live queries, tables, forms, and actions.
              </p>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
