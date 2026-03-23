import { format } from "date-fns";

export function getStatusChipClass(status) {
  if (status === "Priority" || status === "Pending" || status === "DRAFT") {
    return "status-chip--rose";
  }

  if (status === "In progress" || status === "Scheduled" || status === "PUBLISHED") {
    return "status-chip--blue";
  }

  return "status-chip--cream";
}

export function getAlertToneClass(tone) {
  if (tone === "rose") {
    return "status-chip--rose";
  }

  if (tone === "cream") {
    return "status-chip--cream";
  }

  return "status-chip--blue";
}

export function formatDashboardDateLabel(value, fallback = "Not scheduled") {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return format(parsedDate, "dd MMM yyyy");
}

export function EmptyStateCard({ title, body }) {
  return (
    <div className="subtle-card rounded-[24px] p-5">
      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{body}</p>
    </div>
  );
}
