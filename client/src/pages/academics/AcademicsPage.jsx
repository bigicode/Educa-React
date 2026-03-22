import { useState } from "react";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import {
  BookMarked,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  NotebookPen,
} from "lucide-react";
import { AppSelect } from "../../components/ui/AppSelect";
import { ModalShell } from "../../components/ui/ModalShell";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  academicsAssessmentPipeline as assessmentPipeline,
  academicsSubjectProgress as subjectProgress,
} from "../../data/schoolData";
import { useDemoLoading } from "../../hooks/useDemoLoading";
import { getRevealMotion } from "../../lib/motion";

const summaryCards = [
  { label: "Syllabi On Track", value: "84%", detail: "7 departments within pacing guide" },
  { label: "Pending Grading", value: "126", detail: "Across quizzes and assignments" },
  { label: "Assessments This Week", value: "18", detail: "6 internal, 12 class-based" },
];

const teachingBlocks = [
  { time: "08:00 - 09:20", item: "Mathematics block", note: "Grade 11 and 10 revision focus" },
  { time: "09:40 - 11:00", item: "Science practical", note: "Lab 2 requires equipment sign-off" },
  { time: "11:20 - 12:40", item: "ICT assessment slot", note: "Computer lab reserved" },
];

const moderationQueue = [
  { task: "Midterm marking scheme approval", owner: "Head of Academics" },
  { task: "Practical lab rubric confirmation", owner: "Science Department" },
  { task: "Essay moderation note circulation", owner: "Languages Department" },
];

function AcademicsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-32 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-2/3 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
        </div>
        <CardSkeleton className="rounded-[30px]" lines={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card rounded-[30px] p-6">
          <SkeletonBlock className="mb-4 h-4 w-28 rounded-full" />
          <SkeletonBlock className="mb-6 h-8 w-60 rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="subtle-card rounded-[24px] p-5">
                <SkeletonBlock className="mb-3 h-4 w-1/2 rounded-full" />
                <SkeletonBlock className="mb-4 h-2 rounded-full" />
                <SkeletonText lines={1} />
              </div>
            ))}
          </div>
        </div>

        <TableSkeleton rows={4} columns={4} />
      </div>
    </div>
  );
}

export function AcademicsPage() {
  const reduceMotion = useReducedMotion();
  const isLoading = useDemoLoading("academics", 760);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    className: "Grade 10",
    dueDate: "",
    owner: "Academic Office",
  });

  function updateAssessment(field, value) {
    setAssessmentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitAssessment() {
    if (!assessmentForm.title.trim() || !assessmentForm.dueDate.trim()) {
      toast.error("Add an assessment title and due date first.");
      return;
    }

    toast.success(`Assessment scheduled for ${assessmentForm.className}.`);
    setIsAssessmentOpen(false);
    setAssessmentForm({
      title: "",
      className: "Grade 10",
      dueDate: "",
      owner: "Academic Office",
    });
  }

  if (isLoading) {
    return <AcademicsLoadingState />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <p className="eyebrow">Academic Operations</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
            Planning, grading, and moderation can now live in one structured workspace.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This page now reflects practical academic work: assessment setup, subject progress,
            moderation tasks, and teaching blocks. The visuals are flatter and more professional,
            with accents used only where they help attention.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsAssessmentOpen(true)} className="primary-button inline-flex items-center gap-2">
              <NotebookPen size={17} />
              <span>Schedule assessment</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Moderation reminder sent to department heads.")}
              className="secondary-button inline-flex items-center gap-2"
            >
              <FileCheck2 size={17} />
              <span>Send moderation reminder</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Exam Window</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                This week&apos;s milestones
              </h2>
            </div>
            <CalendarClock className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="subtle-card rounded-[24px] p-5">
              <p className="font-display text-lg font-semibold text-[var(--ink-900)]">Midterm drafting closes</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">Tuesday, 23 March</p>
              <div className="mt-4 progress-track">
                <div className="progress-fill" style={{ width: "74%" }} />
              </div>
            </div>
            <div className="subtle-card rounded-[24px] p-5">
              <p className="font-display text-lg font-semibold text-[var(--ink-900)]">Moderation reviews</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">Wednesday through Thursday</p>
              <div className="mt-4 progress-track">
                <div className="progress-fill progress-fill--cream" style={{ width: "58%" }} />
              </div>
            </div>
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item, index) => (
          <motion.article
            key={item.label}
            {...getRevealMotion(reduceMotion, { y: 16, delay: 0.08 + index * 0.05 })}
            className="kpi-card rounded-[28px] p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
              {item.label}
            </p>
            <p className="kpi-value mt-3">{item.value}</p>
            <p className="mt-3 text-sm text-[var(--ink-700)]">{item.detail}</p>
          </motion.article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.18 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Subject Progress</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Pacing guide by department
              </h2>
            </div>
            <BookMarked className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {subjectProgress.map((item) => (
              <div key={item.subject} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {item.subject}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">{item.teacher}</p>
                  </div>
                  <span className="status-chip status-chip--blue">{item.progress}%</span>
                </div>
                <div className="mt-4 progress-track">
                  <div
                    className={item.progress >= 85 ? "progress-fill" : "progress-fill progress-fill--cream"}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.22 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Assessment Pipeline</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                This week&apos;s academic tasks
              </h2>
            </div>
            <ClipboardList className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {assessmentPipeline.map((item) => (
              <div key={item.title} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">{item.owner}</p>
                  </div>
                  <span className="status-chip status-chip--cream">{item.status}</span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  {item.due}
                </p>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.26 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Teaching Blocks</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Timetable highlights for today
              </h2>
            </div>
            <button
              type="button"
              onClick={() => toast.success("Room allocation board opened.")}
              className="chip-button"
            >
              Open room board
            </button>
          </div>

          <div className="space-y-4">
            {teachingBlocks.map((block) => (
              <div key={block.time} className="subtle-card rounded-[24px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                      {block.item}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{block.note}</p>
                  </div>
                  <span className="status-chip status-chip--blue">{block.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.3 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Moderation Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Reviews still pending
              </h2>
            </div>
            <GraduationCap className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {moderationQueue.map((item) => (
              <div key={item.task} className="subtle-card rounded-[24px] p-5">
                <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{item.task}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="status-chip status-chip--cream">{item.owner}</span>
                  <button
                    type="button"
                    className="chip-button"
                    onClick={() => toast.success(`Reminder prepared for ${item.owner}.`)}
                  >
                    Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        title="Schedule assessment"
        description="Create a simple academic task now, then connect it to grading and calendar workflows later."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setIsAssessmentOpen(false)}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={submitAssessment}>
              Save assessment
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Assessment title</span>
            <input
              value={assessmentForm.title}
              onChange={(event) => updateAssessment("title", event.target.value)}
              className="form-input"
              placeholder="Example: Grade 10 Mathematics CAT"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect
              value={assessmentForm.className}
              onChange={(value) => updateAssessment("className", value)}
              options={["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"]}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Owner</span>
            <AppSelect
              value={assessmentForm.owner}
              onChange={(value) => updateAssessment("owner", value)}
              options={[
                "Academic Office",
                "Mathematics Department",
                "Science Department",
                "Languages Department",
              ]}
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Due date</span>
            <input
              type="date"
              value={assessmentForm.dueDate}
              onChange={(event) => updateAssessment("dueDate", event.target.value)}
              className="form-input"
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
