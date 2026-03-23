import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import {
  BookMarked,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  NotebookPen,
  Plus,
} from "lucide-react";
import { AppSelect } from "../../components/ui/AppSelect";
import { ModalShell } from "../../components/ui/ModalShell";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  createAcademicAssessment,
  createAcademicClassMapping,
  createAcademicSubject,
  fetchAcademicsMeta,
  fetchAcademicsOverview,
  getApiErrorMessage,
} from "../../features/academics/api";
import { getRevealMotion } from "../../lib/motion";

const assessmentTypeOptions = [
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "QUIZ", label: "Quiz" },
  { value: "EXAM", label: "Exam" },
  { value: "PROJECT", label: "Project" },
];

const assessmentStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "PUBLISHED", label: "Published" },
];

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

function getCoverageGapChipClass(type) {
  switch (type) {
    case "CLASS_MAPPING":
      return "status-chip--blue";
    case "SUBJECT_MAPPING":
      return "status-chip--cream";
    case "TEACHER_OWNERSHIP":
    default:
      return "status-chip--rose";
  }
}

function getDefaultSubjectForm() {
  return {
    name: "",
    code: "",
    description: "",
  };
}

function getDefaultMappingForm(meta, preset = {}) {
  return {
    schoolClassId: preset.schoolClassId || meta?.classes?.[0]?.id || "",
    subjectId: preset.subjectId || meta?.subjects?.[0]?.id || "",
  };
}

function getDefaultAssessmentForm(meta, preset = {}) {
  const activeAcademicYear = meta?.academicYears?.find((year) => year.isActive) || meta?.academicYears?.[0];
  const activeTerm = activeAcademicYear?.terms?.find((term) => term.isActive) || activeAcademicYear?.terms?.[0];

  return {
    title: "",
    type: "QUIZ",
    status: "SCHEDULED",
    subjectId: preset.subjectId || meta?.subjects?.[0]?.id || "",
    schoolClassId: preset.schoolClassId || meta?.classes?.[0]?.id || "",
    academicYearId: preset.academicYearId || activeAcademicYear?.id || "",
    termId: preset.termId ?? activeTerm?.id ?? "",
    assignedById: preset.assignedById ?? "",
    totalMarks: "100",
    dueDate: "",
  };
}

function buildSubjectPayload(form) {
  return {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    description: form.description.trim() || null,
  };
}

function buildMappingPayload(form) {
  return {
    schoolClassId: form.schoolClassId,
    subjectId: form.subjectId,
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

      <div className="surface-card rounded-[30px] p-6">
        <SkeletonBlock className="mb-5 h-4 w-32 rounded-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </div>

      <TableSkeleton />
    </div>
  );
}

function AcademicsErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Academics</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
        The academics workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function buildAcademicsWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the imported database, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

export function AcademicsPage() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState(getDefaultSubjectForm());
  const [mappingForm, setMappingForm] = useState(getDefaultMappingForm());
  const [assessmentForm, setAssessmentForm] = useState(getDefaultAssessmentForm());
  const deferredSearch = useDeferredValue(search);

  const metaQuery = useQuery({
    queryKey: ["academics", "meta"],
    queryFn: fetchAcademicsMeta,
  });

  const overviewQuery = useQuery({
    queryKey: ["academics", "overview"],
    queryFn: fetchAcademicsOverview,
  });

  const createSubjectMutation = useMutation({
    mutationFn: createAcademicSubject,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response.message || "Subject created successfully.");
      setIsSubjectOpen(false);
      setSubjectForm(getDefaultSubjectForm());
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create the subject."));
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: createAcademicClassMapping,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response.message || "Subject mapped to class successfully.");
      setIsMappingOpen(false);
      setMappingForm(getDefaultMappingForm(metaQuery.data));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to map the subject to the class."));
    },
  });

  const createAssessmentMutation = useMutation({
    mutationFn: createAcademicAssessment,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["academics"] });
      toast.success(response.message || "Assessment scheduled successfully.");
      setIsAssessmentOpen(false);
      setAssessmentForm(getDefaultAssessmentForm(metaQuery.data));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to schedule the assessment."));
    },
  });

  const isInitialLoading = metaQuery.isPending || overviewQuery.isPending;
  const errorMessage = buildAcademicsWorkspaceError([
    { label: "Academics meta", ...metaQuery },
    { label: "Academics overview", ...overviewQuery },
  ]);

  const meta = metaQuery.data;
  const overview = overviewQuery.data;
  const classes = useMemo(() => meta?.classes || [], [meta]);
  const subjects = useMemo(() => meta?.subjects || [], [meta]);
  const teachers = useMemo(() => meta?.teachers || [], [meta]);
  const academicYears = useMemo(() => meta?.academicYears || [], [meta]);
  const activeAcademicYear = overview?.activeAcademicYear || null;
  const classFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All classes" },
      ...classes.map((schoolClass) => ({
        value: schoolClass.id,
        label: schoolClass.label,
      })),
    ],
    [classes],
  );
  const subjectFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All subjects" },
      ...subjects.map((subject) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
      })),
    ],
    [subjects],
  );
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

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredSubjects = useMemo(() => {
    const subjectDirectory = overview?.subjectDirectory || [];

    return subjectDirectory.filter((subject) => {
      const matchesSubject = subjectFilter === "ALL" || subject.id === subjectFilter;
      const matchesClass =
        classFilter === "ALL" || subject.mappedClasses.some((schoolClass) => schoolClass.id === classFilter);
      const matchesSearch =
        !normalizedSearch ||
        subject.name.toLowerCase().includes(normalizedSearch) ||
        subject.code.toLowerCase().includes(normalizedSearch) ||
        subject.teacherOwners.some((teacher) => teacher.name.toLowerCase().includes(normalizedSearch)) ||
        subject.mappedClasses.some((schoolClass) => schoolClass.label.toLowerCase().includes(normalizedSearch));

      return matchesSubject && matchesClass && matchesSearch;
    });
  }, [classFilter, normalizedSearch, overview, subjectFilter]);

  const filteredClasses = useMemo(() => {
    const classDirectory = overview?.classDirectory || [];

    return classDirectory.filter((schoolClass) => {
      const matchesClass = classFilter === "ALL" || schoolClass.id === classFilter;
      const matchesSubject =
        subjectFilter === "ALL" || schoolClass.subjects.some((subject) => subject.id === subjectFilter);
      const matchesSearch =
        !normalizedSearch ||
        schoolClass.label.toLowerCase().includes(normalizedSearch) ||
        schoolClass.subjects.some((subject) => subject.name.toLowerCase().includes(normalizedSearch)) ||
        schoolClass.homeroomTeacher?.fullName.toLowerCase().includes(normalizedSearch);

      return matchesClass && matchesSubject && matchesSearch;
    });
  }, [classFilter, normalizedSearch, overview, subjectFilter]);

  const filteredAssessments = useMemo(() => {
    const assessmentPipeline = overview?.assessmentPipeline || [];

    return assessmentPipeline.filter((assessment) => {
      const matchesSubject = subjectFilter === "ALL" || assessment.subject.id === subjectFilter;
      const matchesClass = classFilter === "ALL" || assessment.schoolClass.id === classFilter;
      const matchesSearch =
        !normalizedSearch ||
        assessment.title.toLowerCase().includes(normalizedSearch) ||
        assessment.subject.name.toLowerCase().includes(normalizedSearch) ||
        assessment.schoolClass.label.toLowerCase().includes(normalizedSearch);

      return matchesSubject && matchesClass && matchesSearch;
    });
  }, [classFilter, normalizedSearch, overview, subjectFilter]);

  const filteredCoverageGaps = useMemo(() => {
    const coverageGaps = overview?.coverageGaps || [];

    return coverageGaps.filter((gap) => {
      const matchesSubject = subjectFilter === "ALL" || gap.subjectId === subjectFilter;
      const matchesClass = classFilter === "ALL" || gap.schoolClassId === classFilter;
      const matchesSearch =
        !normalizedSearch ||
        gap.title.toLowerCase().includes(normalizedSearch) ||
        gap.description.toLowerCase().includes(normalizedSearch);

      return matchesSubject && matchesClass && matchesSearch;
    });
  }, [classFilter, normalizedSearch, overview, subjectFilter]);

  function resetFilters() {
    setSearch("");
    setClassFilter("ALL");
    setSubjectFilter("ALL");
  }

  function openSubjectModal() {
    setSubjectForm(getDefaultSubjectForm());
    setIsSubjectOpen(true);
  }

  function openMappingModal(preset = {}) {
    setMappingForm(getDefaultMappingForm(metaQuery.data, preset));
    setIsMappingOpen(true);
  }

  function openAssessmentModal(preset = {}) {
    setAssessmentForm(getDefaultAssessmentForm(metaQuery.data, preset));
    setIsAssessmentOpen(true);
  }

  function updateAssessment(field, value) {
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

  function submitSubject() {
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      toast.error("Add a subject name and code first.");
      return;
    }

    createSubjectMutation.mutate(buildSubjectPayload(subjectForm));
  }

  function submitMapping() {
    if (!mappingForm.schoolClassId || !mappingForm.subjectId) {
      toast.error("Select both a class and a subject before saving.");
      return;
    }

    createMappingMutation.mutate(buildMappingPayload(mappingForm));
  }

  function submitAssessment() {
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

  if (isInitialLoading) {
    return <AcademicsLoadingState />;
  }

  if (metaQuery.isError || overviewQuery.isError) {
    return (
      <AcademicsErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          overviewQuery.refetch();
        }}
      />
    );
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
            Subjects, class structure, and assessment planning now run on live academic records.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This workspace is connected to the backend academics module. Subject creation, class
            mapping, and assessment scheduling now update real database records instead of demo
            state.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openSubjectModal}
              className="primary-button inline-flex items-center gap-2"
            >
              <Plus size={17} />
              <span>Create subject</span>
            </button>
            <button
              type="button"
              onClick={() => openAssessmentModal()}
              className="secondary-button inline-flex items-center gap-2"
            >
              <NotebookPen size={17} />
              <span>Schedule assessment</span>
            </button>
            <button
              type="button"
              onClick={() => openMappingModal()}
              className="chip-button inline-flex items-center gap-2"
            >
              <FileCheck2 size={16} />
              <span>Map class subject</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Academic Year</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                {activeAcademicYear?.name || "No active year"}
              </h2>
            </div>
            <CalendarClock className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--ink-700)]">
            {activeAcademicYear
              ? `${formatDateLabel(activeAcademicYear.startDate)} to ${formatDateLabel(activeAcademicYear.endDate)}`
              : "Configure an academic year to drive terms, assessments, and reporting."}
          </p>

          <div className="mt-6 space-y-4">
            {activeAcademicYear?.terms?.length ? (
              activeAcademicYear.terms.map((term) => (
                <div key={term.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{term.name}</p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">
                        {formatDateLabel(term.startDate)} to {formatDateLabel(term.endDate)}
                      </p>
                    </div>
                    <span className={`status-chip ${term.isActive ? "status-chip--green" : "status-chip--cream"}`}>
                      {term.isActive ? "ACTIVE" : "PLANNED"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No terms are configured for the current academic year yet.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 16, delay: 0.08 })}
          className="kpi-card rounded-[28px] p-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
            Live Subjects
          </p>
          <p className="kpi-value mt-3">{overview?.summary?.totalSubjects || 0}</p>
          <p className="mt-3 text-sm text-[var(--ink-700)]">Subjects available in the academic catalog</p>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 16, delay: 0.13 })}
          className="kpi-card rounded-[28px] p-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
            Class Mappings
          </p>
          <p className="kpi-value mt-3">{overview?.summary?.totalMappings || 0}</p>
          <p className="mt-3 text-sm text-[var(--ink-700)]">Subject to class links active in the structure</p>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 16, delay: 0.18 })}
          className="kpi-card rounded-[28px] p-6"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
            Assessment Queue
          </p>
          <p className="kpi-value mt-3">{overview?.summary?.totalAssessments || 0}</p>
          <p className="mt-3 text-sm text-[var(--ink-700)]">Draft, scheduled, open, and published assessments</p>
        </motion.article>
      </div>

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 22, delay: 0.18 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Academic Filters</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
              Search subjects, classes, and current academic work
            </h2>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="secondary-button inline-flex items-center gap-2 self-start xl:self-auto"
          >
            <span>Reset filters</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Search subject or class</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input"
              placeholder="Mathematics, Grade 10, teacher..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect value={classFilter} onChange={setClassFilter} options={classFilterOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect value={subjectFilter} onChange={setSubjectFilter} options={subjectFilterOptions} />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => toast.success("Use the coverage panel below to spot missing mappings quickly.")}
              className="chip-button w-full"
            >
              Open coverage notes
            </button>
          </div>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.22 })}
          className="surface-card overflow-hidden rounded-[30px]"
        >
          <div className="flex flex-col gap-4 border-b border-[rgba(8,39,95,0.08)] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Subject Catalog</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Live curriculum structure
              </h2>
            </div>
            <span className="status-chip status-chip--blue">{filteredSubjects.length} subjects</span>
          </div>

          <div className="table-scroll-area">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Mapped Classes</th>
                  <th>Teacher Owners</th>
                  <th>Assessments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.length ? (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">{subject.name}</p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            Code {subject.code}
                            <span className="px-1.5">/</span>
                            {subject.description || "No description yet"}
                          </p>
                        </div>
                      </td>
                      <td>{subject.classMappingsCount}</td>
                      <td>{subject.teacherAssignmentsCount}</td>
                      <td>{subject.assessmentCount}</td>
                      <td>
                        <RowActionsMenu
                          label={`Open actions for ${subject.name}`}
                          actions={[
                            {
                              label: "Map to class",
                              icon: FileCheck2,
                              onSelect: () => openMappingModal({ subjectId: subject.id }),
                            },
                            {
                              label: "Schedule assessment",
                              icon: NotebookPen,
                              onSelect: () =>
                                openAssessmentModal({
                                  subjectId: subject.id,
                                  schoolClassId: subject.mappedClasses[0]?.id || "",
                                }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--ink-700)]">
                      No subjects matched the current filters.
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
              <p className="eyebrow">Assessment Pipeline</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Recent academic tasks
              </h2>
            </div>
            <ClipboardList className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {filteredAssessments.length ? (
              filteredAssessments.map((assessment) => (
                <div key={assessment.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {assessment.title}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">
                        {assessment.subject.name} / {assessment.schoolClass.label}
                      </p>
                    </div>
                    <span className={`status-chip ${getAssessmentStatusChipClass(assessment.status)}`}>
                      {assessment.status}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                    {assessment.type} / Due {formatDateLabel(assessment.dueDate)}
                  </p>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No assessments matched the current filters yet.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.3 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Class Coverage</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Current class structure
              </h2>
            </div>
            <BookMarked className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {filteredClasses.length ? (
              filteredClasses.map((schoolClass) => (
                <div key={schoolClass.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {schoolClass.label}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">
                        Homeroom {schoolClass.homeroomTeacher?.fullName || "Not assigned"}
                      </p>
                    </div>
                    <span className="status-chip status-chip--blue">{schoolClass.subjectCount} subjects</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {schoolClass.subjects.length ? (
                      schoolClass.subjects.map((subject) => (
                        <span key={subject.id} className="status-chip status-chip--cream">
                          {subject.name}
                        </span>
                      ))
                    ) : (
                      <span className="status-chip status-chip--rose">No mapped subjects</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--ink-700)]">{schoolClass.studentCount} active students</p>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => openMappingModal({ schoolClassId: schoolClass.id })}
                    >
                      Map subject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No classes matched the current filters.
              </div>
            )}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.34 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Coverage Gaps</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Items needing follow-up
              </h2>
            </div>
            <GraduationCap className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {filteredCoverageGaps.length ? (
              filteredCoverageGaps.map((gap) => (
                <div key={gap.id} className="subtle-card rounded-[24px] p-5">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{gap.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{gap.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className={`status-chip ${getCoverageGapChipClass(gap.type)}`}>{gap.type}</span>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => {
                        if (gap.type === "TEACHER_OWNERSHIP") {
                          toast.success("Teacher ownership is now managed from the Teachers module.");
                          return;
                        }

                        openMappingModal({
                          schoolClassId: gap.schoolClassId || "",
                          subjectId: gap.subjectId || "",
                        });
                      }}
                    >
                      {gap.actionLabel}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No academic structure gaps matched the current filters.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isSubjectOpen}
        onClose={() => {
          if (!createSubjectMutation.isPending) {
            setIsSubjectOpen(false);
          }
        }}
        title="Create subject"
        description="Add a live subject to the academic catalog before mapping it to classes."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsSubjectOpen(false)}
              disabled={createSubjectMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitSubject}
              disabled={createSubjectMutation.isPending}
            >
              {createSubjectMutation.isPending ? "Saving..." : "Create subject"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject name</span>
            <input
              value={subjectForm.name}
              onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
              className="form-input"
              placeholder="Mathematics"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject code</span>
            <input
              value={subjectForm.code}
              onChange={(event) => setSubjectForm((current) => ({ ...current, code: event.target.value }))}
              className="form-input"
              placeholder="MATH"
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Description</span>
            <textarea
              value={subjectForm.description}
              onChange={(event) =>
                setSubjectForm((current) => ({ ...current, description: event.target.value }))
              }
              className="form-input min-h-28 resize-y"
              placeholder="Short subject summary or curriculum note"
            />
          </label>
        </div>
      </ModalShell>

      <ModalShell
        open={isMappingOpen}
        onClose={() => {
          if (!createMappingMutation.isPending) {
            setIsMappingOpen(false);
          }
        }}
        title="Map subject to class"
        description="Link an existing subject to a class so scheduling and assessments can use the structure."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsMappingOpen(false)}
              disabled={createMappingMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitMapping}
              disabled={createMappingMutation.isPending}
            >
              {createMappingMutation.isPending ? "Saving..." : "Save mapping"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect
              value={mappingForm.schoolClassId}
              onChange={(value) => setMappingForm((current) => ({ ...current, schoolClassId: value }))}
              options={classOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect
              value={mappingForm.subjectId}
              onChange={(value) => setMappingForm((current) => ({ ...current, subjectId: value }))}
              options={subjectOptions}
            />
          </label>
        </div>
      </ModalShell>

      <ModalShell
        open={isAssessmentOpen}
        onClose={() => {
          if (!createAssessmentMutation.isPending) {
            setIsAssessmentOpen(false);
          }
        }}
        title="Schedule assessment"
        description="Create a live assessment tied to the current academic structure."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsAssessmentOpen(false)}
              disabled={createAssessmentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitAssessment}
              disabled={createAssessmentMutation.isPending}
            >
              {createAssessmentMutation.isPending ? "Saving..." : "Save assessment"}
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
              placeholder="Grade 10 Mathematics CAT"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Type</span>
            <AppSelect
              value={assessmentForm.type}
              onChange={(value) => updateAssessment("type", value)}
              options={assessmentTypeOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Status</span>
            <AppSelect
              value={assessmentForm.status}
              onChange={(value) => updateAssessment("status", value)}
              options={assessmentStatusOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect
              value={assessmentForm.subjectId}
              onChange={(value) => updateAssessment("subjectId", value)}
              options={subjectOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect
              value={assessmentForm.schoolClassId}
              onChange={(value) => updateAssessment("schoolClassId", value)}
              options={classOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Academic year</span>
            <AppSelect
              value={assessmentForm.academicYearId}
              onChange={(value) => updateAssessment("academicYearId", value)}
              options={academicYearOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Term</span>
            <AppSelect
              value={assessmentForm.termId}
              onChange={(value) => updateAssessment("termId", value)}
              options={assessmentTermOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Owner</span>
            <AppSelect
              value={assessmentForm.assignedById}
              onChange={(value) => updateAssessment("assignedById", value)}
              options={teacherOwnerOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Total marks</span>
            <input
              type="number"
              min="1"
              value={assessmentForm.totalMarks}
              onChange={(event) => updateAssessment("totalMarks", event.target.value)}
              className="form-input"
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
