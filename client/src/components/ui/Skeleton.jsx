import { cn } from "../../lib/utils";

export function SkeletonBlock({ className }) {
  return <div className={cn("skeleton-block", className)} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className={cn("h-3.5 rounded-full", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className, lines = 3 }) {
  return (
    <div className={cn("surface-card rounded-[28px] p-6", className)}>
      <SkeletonBlock className="mb-5 h-4 w-28 rounded-full" />
      <SkeletonBlock className="mb-4 h-10 w-32 rounded-2xl" />
      <SkeletonText lines={lines} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5, className }) {
  return (
    <div className={cn("overflow-hidden rounded-[28px] border border-[rgba(8,39,95,0.08)]", className)}>
      <div className="grid gap-3 border-b border-[rgba(8,39,95,0.08)] bg-white/80 px-5 py-4 md:grid-cols-5">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={index} className="h-3 rounded-full" />
        ))}
      </div>

      <div className="divide-y divide-[rgba(8,39,95,0.06)] bg-white/75">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3 px-5 py-4 md:grid-cols-5">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <SkeletonBlock key={columnIndex} className="h-4 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
