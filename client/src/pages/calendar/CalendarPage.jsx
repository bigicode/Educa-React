import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Upcoming Events", value: "16", detail: "Includes exams and parent meetings" },
  { label: "Exam Blocks", value: "4", detail: "Already reserved this term" },
  { label: "Conflicts Found", value: "2", detail: "Need timetable review" },
];

const focusItems = [
  {
    title: "Academic calendar",
    description: "Academic year, term windows, breaks, and event blocks will be managed here.",
    status: "Phase 2",
  },
  {
    title: "Assessment visibility",
    description: "Exams and due dates should surface naturally once the assessment module is live.",
    status: "Phase 2",
  },
  {
    title: "Timetable alignment",
    description: "Calendar data will later connect to room usage and personal schedules.",
    status: "Phase 3",
  },
];

const checklistItems = [
  {
    title: "Calendar events",
    description: "Support school events, deadlines, and academic planning milestones.",
  },
  {
    title: "Term awareness",
    description: "Tie events to academic year and term structure for clean filtering.",
  },
  {
    title: "Dashboard widgets",
    description: "Expose upcoming tasks and events in admin, teacher, and student views.",
  },
];

export function CalendarPage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Calendar"
      title="Academic dates, events, and assessment timelines are mapped into one school calendar flow."
      description="This module will support academic planning, scheduling visibility, and upcoming deadlines once assessments and attendance are fully wired."
      primaryActionLabel="Add event"
      secondaryActionLabel="Resolve conflicts"
      stats={stats}
      focusTitle="Scheduling focus"
      focusItems={focusItems}
      checklistTitle="Calendar module foundation"
      checklistItems={checklistItems}
    />
  );
}
