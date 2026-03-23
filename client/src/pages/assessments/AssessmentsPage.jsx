import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import {
  BookCheck,
  Eye,
  FileCheck2,
  GraduationCap,
  NotebookPen,
  Plus,
} from "lucide-react";
import { ModalShell } from "../../components/ui/ModalShell";
import { AppSelect } from "../../components/ui/AppSelect";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  createAssessment,
  fetchAssessmentById,
  fetchAssessmentMeta,
  fetchAssessments,
  getApiErrorMessage,
  saveAssessmentGrades,
  updateAssessmentStatus,
} from "../../features/assessments/api";
import { getRevealMotion } from "../../lib/motion";

function formatDateLabel(value, dateFormat = "dd MMM yyyy") {
  if (!value) {
    return "Not recorded";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not recorded";
  }

  return format(parsedDate, dateFormat);
}

function getAssessmentStatusChipClass(status) {
  switch (status) {
    case "PUBLISHED":
      return "status-chip--green";
    case "OPEN":
    case "SCHEDULED":
      return "status-chip--blue";
    case "CLOSED":
      return "status-chip--cream";
    case "DRAFT":
    default:
      return "status-chip--rose";
  }
}

function getDefaultAssessmentForm(meta, preset = {}) {
  const activeAcademicYear = meta?.academicYears?.find((year) => year.isActive) || meta?.academicYears?.[0];
  const activeTerm = activeAcademicYear?.terms?.find((term) => term.isActive) || activeAcademicYear?.terms?.[0];

  return {
    title: "",
    type: preset.type || "QUIZ",
    status: preset.status || "SCHEDULED",
    subjectId: preset.subjectId || meta?.subjects?.[0]?.id || "",
    schoolClassId: preset.schoolClassId || meta?.classes?.[0]?.id || "",
    academicYearId: preset.academicYearId || activeAcademicYear?.id || "",
    termId: preset.termId ?? activeTerm?.id ?? "",
    assignedById: preset.assignedById ?? "",
    totalMarks: "100",
    dueDate: "",
  };
}

function buildAssessmentPayload(form) {
  return {
    title: form.title.trim(),
    type: form.type,
    status: form.status,
    subjectId: form.subjectId,
    schoolClassId: form.schoolClassId,
    academicYearId: form.academicYearId,
    termId: form.termId || null,
    assignedById: form.assignedById || null,
    totalMarks: Number(form.totalMarks || 100),
    dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : null,
  };
}

function buildGradesPayload(gradeDrafts) {
  return {
    gradeEntries: Object.values(gradeDrafts).map((entry) => ({
      studentId: entry.studentId,
      marks: entry.marks === "" ? null : Number(entry.marks),
      remarks: entry.remarks.trim() || null,
    })),
  };
}

function AssessmentsLoadingState() {
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

      <div className="surface-card rounded-[30px] p-6">
        <SkeletonBlock className="mb-5 h-4 w-32 rounded-full" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </div>

      <TableSkeleton />
    </div>
  );
}

function AssessmentsErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Assessments</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
        The assessments workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function buildAssessmentsWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the imported database, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

function AssessmentDetailLoadingState() {
  return (
    <div className="space-y-5">
      <div className="subtle-card rounded-[24px] p-5">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <SkeletonBlock className="mt-4 h-10 w-2/3 rounded-2xl" />
        <SkeletonText lines={2} className="mt-4" />
      </div>
      <TableSkeleton rows={4} columns={4} />
    </div>
  );
}

function AssessmentDetailErrorState({ message, onRetry }) {
  return (
    <div className="subtle-card rounded-[24px] p-6">
      <p className="eyebrow">Assessment Detail</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink-900)]">
        The assessment detail could not load.
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="secondary-button mt-5" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function AssessmentsPage() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState(getDefaultAssessmentForm());
  const [detailStatus, setDetailStatus] = useState(null);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const deferredSearch = useDeferredValue(search);

  const assessmentFilters = useMemo(
    () => ({
      ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
      ...(classFilter !== "ALL" ? { schoolClassId: classFilter } : {}),
      ...(subjectFilter !== "ALL" ? { subjectId: subjectFilter } : {}),
    }),
    [classFilter, deferredSearch, statusFilter, subjectFilter, typeFilter],
  );

  const metaQuery = useQuery({
    queryKey: ["assessments", "meta"],
    queryFn: fetchAssessmentMeta,
  });

  const overviewQuery = useQuery({
    queryKey: ["assessments", "overview"],
    queryFn: () => fetchAssessments(),
  });

  const assessmentsQuery = useQuery({
    queryKey: ["assessments", "list", assessmentFilters],
    queryFn: () => fetchAssessments(assessmentFilters),
    placeholderData: (previousData) => previousData,
  });

  const assessmentDetailQuery = useQuery({
    queryKey: ["assessments", "detail", selectedAssessment?.id],
    queryFn: () => fetchAssessmentById(selectedAssessment.id),
    enabled: Boolean(isDetailOpen && selectedAssessment?.id),
  });

  const createAssessmentMutation = useMutation({
    mutationFn: createAssessment,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast.success(response.message || "Assessment created successfully.");
      setIsCreateOpen(false);
      setAssessmentForm(getDefaultAssessmentForm(metaQuery.data));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create the assessment."));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ assessmentId, payload }) => updateAssessmentStatus(assessmentId, payload),
    onSuccess: (response) => {
      const updatedAssessment = response.data;

      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      if (updatedAssessment?.id) {
        queryClient.setQueryData(["assessments", "detail", updatedAssessment.id], updatedAssessment);
      }

      toast.success(response.message || "Assessment status updated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update the assessment status."));
    },
  });

  const saveGradesMutation = useMutation({
    mutationFn: ({ assessmentId, payload }) => saveAssessmentGrades(assessmentId, payload),
    onSuccess: (response) => {
      const updatedAssessment = response.data;

      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      if (updatedAssessment?.id) {
        queryClient.setQueryData(["assessments", "detail", updatedAssessment.id], updatedAssessment);
      }

      toast.success(response.message || "Grades saved successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to save grades."));
    },
  });

  const isInitialLoading = metaQuery.isPending || overviewQuery.isPending || assessmentsQuery.isPending;
  const errorMessage = buildAssessmentsWorkspaceError([
    { label: "Assessments meta", ...metaQuery },
    { label: "Assessments overview", ...overviewQuery },
    { label: "Assessments list", ...assessmentsQuery },
  ]);

  const meta = metaQuery.data;
  const classes = useMemo(() => meta?.classes || [], [meta]);
  const subjects = useMemo(() => meta?.subjects || [], [meta]);
  const teachers = useMemo(() => meta?.teachers || [], [meta]);
  const academicYears = useMemo(() => meta?.academicYears || [], [meta]);
  const assessmentStatuses = useMemo(() => meta?.assessmentStatuses || [], [meta]);
  const assessmentTypes = useMemo(() => meta?.assessmentTypes || [], [meta]);

  const classOptions = useMemo(
    () => [
      { value: "", label: "Select class" },
      ...classes.map((schoolClass) => ({
        value: schoolClass.id,
        label: schoolClass.label,
      })),
    ],
    [classes],
  );
  const subjectOptions = useMemo(
    () => [
      { value: "", label: "Select subject" },
      ...subjects.map((subject) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
      })),
    ],
    [subjects],
  );
  const classFilterOptions = useMemo(
    () => [{ value: "ALL", label: "All classes" }, ...classOptions.filter((option) => option.value)],
    [classOptions],
  );
  const subjectFilterOptions = useMemo(
    () => [{ value: "ALL", label: "All subjects" }, ...subjectOptions.filter((option) => option.value)],
    [subjectOptions],
  );
  const teacherOwnerOptions = useMemo(
    () => [
      { value: "", label: "Academic office" },
      ...teachers.map((teacher) => ({
        value: teacher.id,
        label: `${teacher.fullName} (${teacher.employeeCode})`,
      })),
    ],
    [teachers],
  );
  const academicYearOptions = useMemo(
    () =>
      academicYears.map((year) => ({
        value: year.id,
        label: `${year.name}${year.isActive ? " (Active)" : ""}`,
      })),
    [academicYears],
  );
  const assessmentStatusOptions = useMemo(
    () => [
      { value: "ALL", label: "All statuses" },
      ...assessmentStatuses.map((status) => ({
        value: status,
        label: status,
      })),
    ],
    [assessmentStatuses],
  );
  const assessmentTypeOptions = useMemo(
    () => [
      { value: "ALL", label: "All types" },
      ...assessmentTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ],
    [assessmentTypes],
  );
  const createStatusOptions = useMemo(
    () =>
      assessmentStatuses.map((status) => ({
        value: status,
        label: status,
      })),
    [assessmentStatuses],
  );
  const createTypeOptions = useMemo(
    () =>
      assessmentTypes.map((type) => ({
        value: type,
        label: type,
      })),
    [assessmentTypes],
  );
  const assessmentTermOptions = useMemo(() => {
    const selectedAcademicYear = academicYears.find((year) => year.id === assessmentForm.academicYearId);

    return [
      { value: "", label: "No term" },
      ...(selectedAcademicYear?.terms || []).map((term) => ({
        value: term.id,
        label: `${term.name}${term.isActive ? " (Active)" : ""}`,
      })),
    ];
  }, [academicYears, assessmentForm.academicYearId]);

  const overviewAssessments = useMemo(() => overviewQuery.data?.data || [], [overviewQuery.data]);
  const filteredAssessments = useMemo(() => assessmentsQuery.data?.data || [], [assessmentsQuery.data]);
  const gradingQueue = useMemo(
    () => overviewAssessments.filter((assessment) => assessment.grading.pendingCount > 0).slice(0, 4),
    [overviewAssessments],
  );
  const summaryCards = useMemo(() => {
    const scheduledCount = overviewAssessments.filter((assessment) =>
      ["SCHEDULED", "OPEN"].includes(assessment.status),
    ).length;
    const pendingGrading = overviewAssessments.reduce(
      (total, assessment) => total + assessment.grading.pendingCount,
      0,
    );
    const publishedResults = overviewAssessments.filter((assessment) => assessment.status === "PUBLISHED").length;

    return [
      { label: "Scheduled or Open", value: String(scheduledCount), detail: "Assessments currently in motion" },
      { label: "Pending Grading", value: String(pendingGrading), detail: "Roster entries still waiting for marks" },
      { label: "Published Results", value: String(publishedResults), detail: "Assessments already visible as final" },
    ];
  }, [overviewAssessments]);

  const selectedAssessmentDetail = assessmentDetailQuery.data || selectedAssessment;

  function openCreateModal(preset = {}) {
    setAssessmentForm(getDefaultAssessmentForm(metaQuery.data, preset));
    setIsCreateOpen(true);
  }

  function openAssessmentDetail(assessment) {
    setSelectedAssessment(assessment);
    setDetailStatus(null);
    setGradeDrafts({});
    setIsDetailOpen(true);
  }

  function closeAssessmentDetail() {
    setIsDetailOpen(false);
    setSelectedAssessment(null);
    setDetailStatus(null);
    setGradeDrafts({});
  }

  function updateAssessmentForm(field, value) {
    setAssessmentForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "academicYearId") {
        const selectedAcademicYear = academicYears.find((year) => year.id === value);
        const activeTerm = selectedAcademicYear?.terms?.find((term) => term.isActive) || selectedAcademicYear?.terms?.[0];
        next.termId = activeTerm?.id || "";
      }

      return next;
    });
  }

  function updateGradeDraft(studentId, field, value) {
    setGradeDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || { studentId, marks: "", remarks: "" }),
        [field]: value,
      },
    }));
  }

  function submitAssessmentCreate() {
    if (
      !assessmentForm.title.trim() ||
      !assessmentForm.subjectId ||
      !assessmentForm.schoolClassId ||
      !assessmentForm.academicYearId
    ) {
      toast.error("Complete the required assessment fields before saving.");
      return;
    }

    createAssessmentMutation.mutate(buildAssessmentPayload(assessmentForm));
  }

  function submitStatusUpdate() {
    if (!selectedAssessmentDetail?.id) {
      return;
    }

    updateStatusMutation.mutate({
      assessmentId: selectedAssessmentDetail.id,
      payload: { status: detailStatus || selectedAssessmentDetail.status },
    });
  }

  function submitGrades() {
    if (!selectedAssessmentDetail?.id) {
      return;
    }

    if (!rosterRows.length) {
      toast.error("There are no active students available for grade entry.");
      return;
    }

    saveGradesMutation.mutate({
      assessmentId: selectedAssessmentDetail.id,
      payload: buildGradesPayload(gradeDrafts),
    });
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setClassFilter("ALL");
    setSubjectFilter("ALL");
  }

  if (isInitialLoading) {
    return <AssessmentsLoadingState />;
  }

  if (metaQuery.isError || overviewQuery.isError || assessmentsQuery.isError) {
    return (
      <AssessmentsErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          overviewQuery.refetch();
          assessmentsQuery.refetch();
        }}
      />
    );
  }

  const rosterRows = selectedAssessmentDetail?.roster?.map((item) => ({
    student: item.student,
    marks:
      gradeDrafts[item.student.id]?.marks ??
      (item.grade?.marks === null || item.grade?.marks === undefined ? "" : String(item.grade.marks)),
    remarks: gradeDrafts[item.student.id]?.remarks ?? (item.grade?.remarks || ""),
  })) || [];

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <p className="eyebrow">Assessments</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
            Live assessments, grading progress, and result publishing now run in one workspace.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This module is connected to the assessment records already created in the system.
            Teachers and admins can now review grading progress, update status, and save student
            marks against the real class roster.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="primary-button inline-flex items-center gap-2"
            >
              <Plus size={17} />
              <span>Create assessment</span>
            </button>
            <button
              type="button"
              onClick={() =>
                gradingQueue.length
                  ? openAssessmentDetail(gradingQueue[0])
                  : toast.success("There are no grading backlogs at the moment.")
              }
              className="secondary-button inline-flex items-center gap-2"
            >
              <NotebookPen size={17} />
              <span>Open grading queue</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Grading Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Assessments needing follow-up
              </h2>
            </div>
            <BookCheck className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {gradingQueue.length ? (
              gradingQueue.map((assessment) => (
                <div key={assessment.id} className="subtle-card rounded-[24px] p-4">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {assessment.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                    {assessment.subject.name} / {assessment.schoolClass.label}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="status-chip status-chip--cream">
                      {assessment.grading.pendingCount} pending
                    </span>
                    <button type="button" className="chip-button" onClick={() => openAssessmentDetail(assessment)}>
                      Grade now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No assessments are waiting on grading right now.
              </div>
            )}
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

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 22, delay: 0.18 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Assessment Filters</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
              Search and filter the live assessment list
            </h2>
          </div>
          <button type="button" onClick={resetFilters} className="secondary-button self-start xl:self-auto">
            Reset filters
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block space-y-2 xl:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Search assessment or subject</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input"
              placeholder="Grade 10 CAT, Mathematics, Grade 8..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Status</span>
            <AppSelect value={statusFilter} onChange={setStatusFilter} options={assessmentStatusOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Type</span>
            <AppSelect value={typeFilter} onChange={setTypeFilter} options={assessmentTypeOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect value={classFilter} onChange={setClassFilter} options={classFilterOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect value={subjectFilter} onChange={setSubjectFilter} options={subjectFilterOptions} />
          </label>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.22 })}
          className="surface-card overflow-hidden rounded-[30px]"
        >
          <div className="flex flex-col gap-4 border-b border-[rgba(8,39,95,0.08)] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Assessment Roster</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Assessments matching your filters
              </h2>
            </div>
            <span className="status-chip status-chip--blue">
              {assessmentsQuery.data?.total ?? filteredAssessments.length} records
            </span>
          </div>

          <div className="table-scroll-area">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Class</th>
                  <th>Owner</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.length ? (
                  filteredAssessments.map((assessment) => (
                    <tr key={assessment.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">{assessment.title}</p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            {assessment.subject.name}
                            <span className="px-1.5">/</span>
                            {assessment.type}
                            <span className="px-1.5">/</span>
                            Due {formatDateLabel(assessment.dueDate)}
                          </p>
                        </div>
                      </td>
                      <td>{assessment.schoolClass.label}</td>
                      <td>{assessment.assignedBy?.fullName || "Academic Office"}</td>
                      <td>
                        <div>
                          <p className="font-medium text-[var(--ink-900)]">
                            {assessment.grading.gradeCount}/{assessment.grading.rosterCount} graded
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            {assessment.grading.pendingCount} pending / Avg {assessment.grading.averageMarks ?? "n/a"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip ${getAssessmentStatusChipClass(assessment.status)}`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td>
                        <RowActionsMenu
                          label={`Open actions for ${assessment.title}`}
                          actions={[
                            {
                              label: "View",
                              icon: Eye,
                              onSelect: () => openAssessmentDetail(assessment),
                            },
                            {
                              label: "Grade",
                              icon: NotebookPen,
                              onSelect: () => openAssessmentDetail(assessment),
                            },
                            {
                              label: "Publish",
                              icon: FileCheck2,
                              onSelect: () =>
                                updateStatusMutation.mutate({
                                  assessmentId: assessment.id,
                                  payload: { status: "PUBLISHED" },
                                }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--ink-700)]">
                      No assessments matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.26 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Result Flow</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Publishing checkpoints
              </h2>
            </div>
            <GraduationCap className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {filteredAssessments.slice(0, 4).length ? (
              filteredAssessments.slice(0, 4).map((assessment) => (
                <div key={assessment.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {assessment.title}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">
                        {assessment.schoolClass.label} / {assessment.subject.code}
                      </p>
                    </div>
                    <span className={`status-chip ${getAssessmentStatusChipClass(assessment.status)}`}>
                      {assessment.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="status-chip status-chip--cream">
                      {assessment.grading.completionRate}% complete
                    </span>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => openAssessmentDetail(assessment)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No result checkpoints matched the current filters.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isDetailOpen}
        onClose={closeAssessmentDetail}
        size="wide"
        title={selectedAssessmentDetail?.title || "Assessment detail"}
        description="Review the live class roster, update publishing status, and save student grades."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={closeAssessmentDetail}>
              Close
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={submitStatusUpdate}
              disabled={updateStatusMutation.isPending || !selectedAssessmentDetail}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update status"}
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitGrades}
              disabled={saveGradesMutation.isPending || !selectedAssessmentDetail}
            >
              {saveGradesMutation.isPending ? "Saving..." : "Save grades"}
            </button>
          </>
        }
      >
        {assessmentDetailQuery.isPending ? (
          <AssessmentDetailLoadingState />
        ) : assessmentDetailQuery.isError ? (
          <AssessmentDetailErrorState
            message={getApiErrorMessage(
              assessmentDetailQuery.error,
              "Refresh the assessment detail or verify the backend connection.",
            )}
            onRetry={() => assessmentDetailQuery.refetch()}
          />
        ) : selectedAssessmentDetail ? (
          <div className="space-y-6">
            <div className="subtle-card rounded-[24px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="eyebrow">Assessment Snapshot</p>
                  <h3 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                    {selectedAssessmentDetail.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-700)]">
                    {selectedAssessmentDetail.subject.name} / {selectedAssessmentDetail.schoolClass.label} /{" "}
                    {selectedAssessmentDetail.type}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`status-chip ${getAssessmentStatusChipClass(selectedAssessmentDetail.status)}`}>
                    {selectedAssessmentDetail.status}
                  </span>
                  <span className="status-chip status-chip--blue">
                    {selectedAssessmentDetail.grading.completionRate}% complete
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="subtle-card rounded-[20px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Due Date</p>
                  <p className="mt-3 font-semibold text-[var(--ink-900)]">
                    {formatDateLabel(selectedAssessmentDetail.dueDate)}
                  </p>
                </div>
                <div className="subtle-card rounded-[20px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Total Marks</p>
                  <p className="mt-3 font-semibold text-[var(--ink-900)]">{selectedAssessmentDetail.totalMarks}</p>
                </div>
                <div className="subtle-card rounded-[20px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Graded</p>
                  <p className="mt-3 font-semibold text-[var(--ink-900)]">
                    {selectedAssessmentDetail.grading.gradeCount}/{selectedAssessmentDetail.grading.rosterCount}
                  </p>
                </div>
                <div className="subtle-card rounded-[20px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Average</p>
                  <p className="mt-3 font-semibold text-[var(--ink-900)]">
                    {selectedAssessmentDetail.grading.averageMarks ?? "n/a"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--ink-900)]">Publishing status</span>
                  <AppSelect
                    value={detailStatus || selectedAssessmentDetail.status}
                    onChange={setDetailStatus}
                    options={createStatusOptions}
                  />
                </label>

                <div className="subtle-card rounded-[20px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Owner</p>
                  <p className="mt-3 font-semibold text-[var(--ink-900)]">
                    {selectedAssessmentDetail.assignedBy?.fullName || "Academic Office"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-700)]">
                    {selectedAssessmentDetail.academicYear.name}
                    {selectedAssessmentDetail.term ? ` / ${selectedAssessmentDetail.term.name}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-card overflow-hidden rounded-[26px] border border-[rgba(8,39,95,0.08)]">
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(8,39,95,0.08)] px-5 py-4">
                <div>
                  <p className="eyebrow">Grade Entry</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                    Class roster
                  </h3>
                </div>
                <span className="status-chip status-chip--blue">
                  {selectedAssessmentDetail.roster.length} students
                </span>
              </div>

              <div className="table-scroll-area">
                <table className="table-shell min-w-full text-left">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Marks</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterRows.length ? (
                      rosterRows.map((item) => (
                        <tr key={item.student.id}>
                          <td>
                            <div>
                              <p className="font-semibold text-[var(--ink-900)]">{item.student.fullName}</p>
                              <p className="mt-1 text-xs text-[var(--ink-500)]">
                                Admission {item.student.admissionNumber}
                              </p>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={selectedAssessmentDetail.totalMarks}
                              value={item.marks}
                              onChange={(event) => updateGradeDraft(item.student.id, "marks", event.target.value)}
                              className="form-input min-w-28"
                              placeholder={`0 - ${selectedAssessmentDetail.totalMarks}`}
                            />
                          </td>
                          <td>
                            <input
                              value={item.remarks}
                              onChange={(event) => updateGradeDraft(item.student.id, "remarks", event.target.value)}
                              className="form-input min-w-56"
                              placeholder="Teacher remark"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-[var(--ink-700)]">
                          No active students were found in the roster for this assessment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={isCreateOpen}
        onClose={() => {
          if (!createAssessmentMutation.isPending) {
            setIsCreateOpen(false);
          }
        }}
        title="Create assessment"
        description="Create a live assessment entry tied to class, subject, and academic year."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsCreateOpen(false)}
              disabled={createAssessmentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitAssessmentCreate}
              disabled={createAssessmentMutation.isPending}
            >
              {createAssessmentMutation.isPending ? "Saving..." : "Create assessment"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Assessment title</span>
            <input
              value={assessmentForm.title}
              onChange={(event) => updateAssessmentForm("title", event.target.value)}
              className="form-input"
              placeholder="Grade 10 Mathematics CAT"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Type</span>
            <AppSelect value={assessmentForm.type} onChange={(value) => updateAssessmentForm("type", value)} options={createTypeOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Status</span>
            <AppSelect value={assessmentForm.status} onChange={(value) => updateAssessmentForm("status", value)} options={createStatusOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect value={assessmentForm.subjectId} onChange={(value) => updateAssessmentForm("subjectId", value)} options={subjectOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect value={assessmentForm.schoolClassId} onChange={(value) => updateAssessmentForm("schoolClassId", value)} options={classOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Academic year</span>
            <AppSelect value={assessmentForm.academicYearId} onChange={(value) => updateAssessmentForm("academicYearId", value)} options={academicYearOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Term</span>
            <AppSelect value={assessmentForm.termId} onChange={(value) => updateAssessmentForm("termId", value)} options={assessmentTermOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Owner</span>
            <AppSelect value={assessmentForm.assignedById} onChange={(value) => updateAssessmentForm("assignedById", value)} options={teacherOwnerOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Total marks</span>
            <input
              type="number"
              min="1"
              value={assessmentForm.totalMarks}
              onChange={(event) => updateAssessmentForm("totalMarks", event.target.value)}
              className="form-input"
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Due date</span>
            <input
              type="date"
              value={assessmentForm.dueDate}
              onChange={(event) => updateAssessmentForm("dueDate", event.target.value)}
              className="form-input"
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
