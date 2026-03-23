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
