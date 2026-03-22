import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Scheduled Papers", value: "24", detail: "Across quizzes, CATs, and exams" },
  { label: "Pending Grading", value: "11", detail: "Need teacher follow-up" },
  { label: "Published Results", value: "42", detail: "Visible to the academic office" },
];

const focusItems = [
  {
    title: "Assessment creation",
    description: "Assignments, quizzes, and exams will be authored against subjects and classes.",
    status: "Phase 1",
  },
  {
    title: "Grade entry",
    description: "Marks per student should be stored against each assessment record.",
    status: "Phase 1",
  },
  {
    title: "Result publishing",
    description: "Draft, open, closed, and published states will control visibility.",
    status: "Phase 2",
  },
];

const checklistItems = [
  {
    title: "Assessment model",
    description: "Define type, subject, class, term, total marks, and publishing status.",
  },
  {
    title: "Grade entries",
    description: "Record marks per student with remarks and unique assessment mapping.",
  },
  {
    title: "Analytics readiness",
    description: "Use this data later for grade trends, class comparisons, and report cards.",
  },
];

export function AssessmentsPage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Assessments"
      title="Assignments, quizzes, exams, and grade capture now have a dedicated build track."
      description="This module will become the source of truth for subject assessments, grade entry, publishing, and academic performance analysis."
      primaryActionLabel="Create assessment"
      secondaryActionLabel="Open grading queue"
      stats={stats}
      focusTitle="Assessment rollout"
      focusItems={focusItems}
      checklistTitle="Assessments module foundation"
      checklistItems={checklistItems}
    />
  );
}
