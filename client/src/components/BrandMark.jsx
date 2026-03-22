import { GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

export function BrandMark({ variant = "light", compact = false, className }) {
  const isDark = variant === "dark";

  return (
    <div className={cn("inline-flex items-center", compact ? "justify-center" : "gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border shadow-lg",
          compact ? "h-[3.25rem] w-[3.25rem]" : "h-14 w-14",
          isDark
            ? "border-white/15 bg-white/10 text-[#fffacd] shadow-[#021941]/30"
            : "border-[rgba(0,71,171,0.14)] bg-[linear-gradient(135deg,#fffacd_0%,#fffef2_100%)] text-[#0047ab] shadow-[#0c2d6c]/10",
        )}
      >
        <GraduationCap size={compact ? 24 : 28} />
      </div>

      {!compact ? (
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.34em]",
              isDark ? "text-[#fffacd]" : "text-[#0047ab]",
            )}
          >
            Educa
          </p>
          <p
            className={cn(
              "font-display text-xl font-bold leading-none",
              isDark ? "text-white" : "text-[var(--ink-900)]",
            )}
          >
            School System
          </p>
        </div>
      ) : null}
    </div>
  );
}
