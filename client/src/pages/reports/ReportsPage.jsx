import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Ready Reports", value: "12", detail: "Attendance and roster exports next" },
  { label: "Scheduled Runs", value: "4", detail: "Weekly admin delivery planned" },
  { label: "Shared Views", value: "9", detail: "Role-based dashboards coming" },
];

const focusItems = [
  {
    title: "Operational reporting",
    description: "Attendance, student counts, and grade summaries should be exportable first.",
    status: "Phase 2",
  },
  {
    title: "Dashboard feeds",
    description: "Reports should reuse the same source queries as live dashboard widgets.",
    status: "Phase 2",
  },
  {
    title: "Scheduled exports",
    description: "Automated PDF and CSV delivery comes after the first live reports.",
    status: "Phase 3",
  },
];

const checklistItems = [
  {
    title: "Report sources",
    description: "Use consistent backend queries for dashboards, exports, and summary widgets.",
  },
  {
    title: "Role filtering",
    description: "Admins, teachers, students, and parents should only see what applies to them.",
  },
  {
    title: "Export pipeline",
    description: "Prepare CSV and PDF generation once the core modules start returning real data.",
  },
];

export function ReportsPage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Reports"
      title="Operational insights, exports, and scheduled reporting are now mapped into the product flow."
      description="This module will turn attendance, student, and assessment data into dashboards, exports, and role-based reporting for the school."
      primaryActionLabel="Build report"
      secondaryActionLabel="Review metrics"
      stats={stats}
      focusTitle="Reporting rollout"
      focusItems={focusItems}
      checklistTitle="Reports module foundation"
      checklistItems={checklistItems}
    />
  );
}
