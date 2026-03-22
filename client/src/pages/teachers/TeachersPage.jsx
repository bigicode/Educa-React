import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Active Teachers", value: "86", detail: "14 department leads assigned" },
  { label: "Subject Loads", value: "214", detail: "Across all grade levels" },
  { label: "Coverage Gaps", value: "3", detail: "Need substitute planning" },
];

const focusItems = [
  {
    title: "Teacher profiles",
    description: "Personal, employment, and qualification records will live here.",
    status: "Phase 1",
  },
  {
    title: "Subject allocation",
    description: "Map teachers to classes and subjects before attendance and grades go live.",
    status: "Phase 1",
  },
  {
    title: "Workload balance",
    description: "Track timetables, office hours, and replacement coverage.",
    status: "Phase 2",
  },
];

const checklistItems = [
  {
    title: "Teacher CRUD",
    description: "Create, edit, archive, and activate staff accounts with profile details.",
  },
  {
    title: "Assignment mapping",
    description: "Link each teacher to subjects, homeroom classes, and academic year context.",
  },
  {
    title: "Readiness for attendance",
    description: "Use these assignments to control who can mark attendance and author assessments.",
  },
];

export function TeachersPage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Teacher Management"
      title="Teacher records, allocations, and school coverage now have a dedicated workspace."
      description="This module is where teacher profiles, subject allocations, workload planning, and attendance ownership will be managed as real school data."
      primaryActionLabel="Create teacher"
      secondaryActionLabel="Review allocations"
      stats={stats}
      focusTitle="Staff delivery track"
      focusItems={focusItems}
      checklistTitle="Teacher module foundation"
      checklistItems={checklistItems}
    />
  );
}
