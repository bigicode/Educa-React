import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { motionEase } from "../../lib/motion";

export function ModalShell({ open, onClose, title, description, children, footer, size = "default" }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.16 : 0.24 }}
          onClick={onClose}
        >
          <motion.div
            className={`modal-panel modal-panel--${size}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: reduceMotion ? 0.18 : 0.34,
                ease: motionEase.entrance,
              },
            }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : 16,
              transition: {
                duration: reduceMotion ? 0.14 : 0.22,
                ease: motionEase.exit,
              },
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <div>
                <p className="eyebrow">Workspace Action</p>
                <h2 className="mt-2 font-display text-xl font-bold text-[var(--ink-900)] md:text-2xl">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-700)]">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(8,39,95,0.08)] bg-white text-[var(--ink-700)] transition hover:border-[rgba(0,71,171,0.18)] hover:text-[var(--brand-blue-700)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-panel__body">{children}</div>

            {footer ? (
              <div className="modal-panel__footer">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
