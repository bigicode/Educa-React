import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/utils";

function normalizeOptions(options) {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export function AppSelect({ value, onChange, options, placeholder = "Select option", disabled = false, className }) {
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("down");
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const selectedOption = normalizedOptions.find((option) => option.value === value) || null;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
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
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 220;
      const menuWidth = triggerRef.current?.offsetWidth ?? 220;
      const viewportPadding = 12;

      if (!triggerRect) {
        return;
      }

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenUp = spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow;

      setDirection(shouldOpenUp ? "up" : "down");
      setMenuStyle({
        width: menuWidth,
        top: shouldOpenUp
          ? Math.max(viewportPadding, triggerRect.top - menuHeight - 10)
          : Math.min(window.innerHeight - menuHeight - viewportPadding, triggerRect.bottom + 10),
        left: Math.min(
          window.innerWidth - menuWidth - viewportPadding,
          Math.max(viewportPadding, triggerRect.left),
        ),
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
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "select-trigger",
          !selectedOption && "select-trigger--placeholder",
          disabled && "select-trigger--disabled",
          className,
        )}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="select-trigger__label">{selectedOption?.label || placeholder}</span>
        <ChevronDown size={18} className={cn("select-trigger__icon", open && "select-trigger__icon--open")} />
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
              className="topbar-dropdown select-popover fixed z-[125] p-2"
              style={{
                top: `${menuStyle.top}px`,
                left: `${menuStyle.left}px`,
                width: `${menuStyle.width}px`,
                transformOrigin: direction === "up" ? "bottom center" : "top center",
              }}
            >
              <div className="select-popover__list" role="listbox">
                {normalizedOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn("select-option", isSelected && "select-option--selected")}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                      <Check size={16} className={cn("select-option__check", isSelected && "opacity-100")} />
                    </button>
                  );
                })}
              </div>
            </motion.div>,
            document.body,
          )
        : null}
    </>
  );
}
