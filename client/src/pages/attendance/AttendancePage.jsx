import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Today's Attendance", value: "94.6%", detail: "System target is above 96%" },
  { label: "Late Arrivals", value: "18", detail: "Captured before second period" },
  { label: "Classes Pending", value: "7", detail: "Registers not yet submitted" },
];

const focusItems = [
  {
    title: "Class registers",
    description: "Daily attendance by class and date is the first real operation to wire here.",
    status: "Phase 1",
  },
  {
    title: "Student flags",
    description: "Present, absent, late, and excused statuses need to be tracked reliably.",
    status: "Phase 1",
  },
  {
    title: "Guardian alerts",
    description: "Absence notifications and follow-up workflows come right after the base records.",
    status: "Phase 2",
  },
];

const checklistItems = [
  {
    title: "Attendance records",
    description: "Store each student status by date, class, term, and teacher recorder.",
  },
  {
    title: "Class submission flow",
    description: "Allow teachers to submit registers and admins to monitor pending classes.",
  },
  {
    title: "Dashboard connection",
    description: "Feed live attendance numbers into admin, teacher, and student dashboards.",
  },
];

export function AttendancePage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Attendance"
      title="Daily registers, late tracking, and attendance monitoring are now part of the core build."
      description="Attendance is one of the first real operational features because it drives dashboards, notifications, student follow-up, and parent communication."
      primaryActionLabel="Open class register"
      secondaryActionLabel="View watchlist"
      stats={stats}
      focusTitle="Attendance rollout"
      focusItems={focusItems}
      checklistTitle="Attendance module foundation"
      checklistItems={checklistItems}
    />
  );
}
