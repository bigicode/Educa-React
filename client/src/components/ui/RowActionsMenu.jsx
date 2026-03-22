import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { MoreHorizontal } from "lucide-react";

export function RowActionsMenu({ label, actions }) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("down");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function updatePlacement() {
      const triggerRect = containerRef.current?.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 168;
      const menuWidth = menuRef.current?.offsetWidth ?? 208;
      const viewportPadding = 12;

      if (!triggerRect) {
        return;
      }

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenUp = spaceBelow < menuHeight + 18 && spaceAbove > spaceBelow;
      const nextTop = shouldOpenUp
        ? Math.max(viewportPadding, triggerRect.top - menuHeight - 10)
        : Math.min(window.innerHeight - menuHeight - viewportPadding, triggerRect.bottom + 10);
      const nextLeft = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, triggerRect.right - menuWidth),
      );

      setDirection(shouldOpenUp ? "up" : "down");
      setMenuStyle({
        top: nextTop,
        left: nextLeft,
      });
    }

    updatePlacement();

    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }

    const triggerRect = containerRef.current?.getBoundingClientRect();

    if (triggerRect) {
      const estimatedMenuHeight = 168;
      const estimatedMenuWidth = 208;
      const viewportPadding = 12;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenUp = spaceBelow < estimatedMenuHeight + 18 && spaceAbove > spaceBelow;

      setDirection(shouldOpenUp ? "up" : "down");
      setMenuStyle({
        top: shouldOpenUp
          ? Math.max(viewportPadding, triggerRect.top - estimatedMenuHeight - 10)
          : Math.min(window.innerHeight - estimatedMenuHeight - viewportPadding, triggerRect.bottom + 10),
        left: Math.min(
          window.innerWidth - estimatedMenuWidth - viewportPadding,
          Math.max(viewportPadding, triggerRect.right - estimatedMenuWidth),
        ),
      });
    }

    setOpen(true);
  }

  return (
    <div ref={containerRef} className="row-actions relative inline-flex justify-end">
      <button
        type="button"
        className="row-actions-trigger"
        onClick={handleToggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <motion.div
              ref={menuRef}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: direction === "up" ? -8 : 8, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduceMotion ? 0.16 : 0.22 }}
              className="topbar-dropdown row-actions-popover fixed z-[120] w-52 p-2"
              style={{
                top: `${menuStyle.top}px`,
                left: `${menuStyle.left}px`,
                transformOrigin: direction === "up" ? "bottom right" : "top right",
              }}
              role="menu"
            >
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    role="menuitem"
                    className={`menu-item ${action.tone === "danger" ? "menu-item--danger" : ""}`}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                  >
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </motion.div>,
            document.body,
          )
        : null}
    </div>
  );
}
