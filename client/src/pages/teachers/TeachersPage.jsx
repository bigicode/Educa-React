import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import {
  Archive,
  BookOpen,
  BriefcaseBusiness,
  Eye,
  PencilLine,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ModalShell } from "../../components/ui/ModalShell";
import { AppSelect } from "../../components/ui/AppSelect";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  archiveTeacher,
  createTeacher,
  fetchTeacherById,
  fetchTeacherMeta,
  fetchTeachers,
  getApiErrorMessage,
  updateTeacher,
} from "../../features/teachers/api";
import { getRevealMotion } from "../../lib/motion";

const teacherStatusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function getClassLabel(schoolClass) {
  if (!schoolClass) {
    return "Not assigned";
  }

  return schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name;
}

function getTeacherStatusChipClass(isActive) {
  return isActive ? "status-chip--green" : "status-chip--rose";
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

function getAttendanceStatusChipClass(status) {
  switch (status) {
    case "PRESENT":
      return "status-chip--green";
    case "LATE":
      return "status-chip--cream";
    case "EXCUSED":
      return "status-chip--blue";
    case "ABSENT":
    default:
      return "status-chip--rose";
  }
}

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

function getDefaultTeacherForm(teacher) {
  return {
    firstName: teacher?.firstName || "",
    lastName: teacher?.lastName || "",
    email: teacher?.email || "",
    password: "Teacher@12345",
    employeeCode: teacher?.employeeCode || "",
    phoneNumber: teacher?.phoneNumber || "",
    qualification: teacher?.qualification || "",
    homeroomClassId: teacher?.primaryHomeroomClass?.id || "",
    subjectId: teacher?.primarySubjectAssignment?.subject?.id || "",
    assignmentClassId: teacher?.primarySubjectAssignment?.schoolClass?.id || "",
    accountStatus: teacher ? (teacher.isActive ? "ACTIVE" : "INACTIVE") : "ACTIVE",
  };
}

function buildTeacherPayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
    employeeCode: form.employeeCode.trim(),
    phoneNumber: form.phoneNumber.trim() || null,
    qualification: form.qualification.trim() || null,
    homeroomClassId: form.homeroomClassId || null,
    subjectId: form.subjectId || null,
    assignmentClassId: form.assignmentClassId || null,
  };
}

function buildTeacherUpdatePayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    employeeCode: form.employeeCode.trim(),
    phoneNumber: form.phoneNumber.trim() || null,
    qualification: form.qualification.trim() || null,
    homeroomClassId: form.homeroomClassId || null,
    subjectId: form.subjectId || null,
    assignmentClassId: form.assignmentClassId || null,
    accountStatus: form.accountStatus,
  };
}

function TeachersLoadingState() {
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

function TeachersErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Teachers</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
        The teacher workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function buildTeachersWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the imported database, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

function TeacherProfileLoadingState() {
  return (
    <div className="space-y-5">
      <div className="subtle-card rounded-[24px] p-5">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <SkeletonBlock className="mt-4 h-10 w-2/3 rounded-2xl" />
        <SkeletonText lines={2} className="mt-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="subtle-card rounded-[22px] p-4">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-32 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="subtle-card rounded-[22px] p-4">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonText lines={3} className="mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherProfileErrorState({ message, onRetry }) {
  return (
    <div className="subtle-card rounded-[24px] p-6">
      <p className="eyebrow">Teacher Profile</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink-900)]">
        The teacher profile could not load.
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="secondary-button mt-5" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function TeachersPage() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState(getDefaultTeacherForm());
  const [editForm, setEditForm] = useState(getDefaultTeacherForm());
  const [archiveTarget, setArchiveTarget] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const teacherFilters = useMemo(
    () => ({
      ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(subjectFilter !== "ALL" ? { subjectId: subjectFilter } : {}),
    }),
    [deferredSearch, statusFilter, subjectFilter],
  );

  const metaQuery = useQuery({
    queryKey: ["teachers", "meta"],
    queryFn: fetchTeacherMeta,
  });

  const overviewQuery = useQuery({
    queryKey: ["teachers", "overview"],
    queryFn: () => fetchTeachers(),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers", "list", teacherFilters],
    queryFn: () => fetchTeachers(teacherFilters),
    placeholderData: (previousData) => previousData,
  });

  const teacherDetailQuery = useQuery({
    queryKey: ["teachers", "detail", selectedTeacher?.id],
    queryFn: () => fetchTeacherById(selectedTeacher.id),
    enabled: Boolean(isProfileOpen && selectedTeacher?.id),
  });

  const createTeacherMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success(response.message || "Teacher created successfully.");
      setIsCreateOpen(false);
      setTeacherForm(getDefaultTeacherForm());
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create the teacher record."));
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ teacherId, payload }) => updateTeacher(teacherId, payload),
    onSuccess: (response) => {
      const updatedTeacher = response.data;

      queryClient.invalidateQueries({ queryKey: ["teachers"] });

      if (updatedTeacher?.id) {
        queryClient.invalidateQueries({ queryKey: ["teachers", "detail", updatedTeacher.id] });
        setSelectedTeacher(updatedTeacher);
      }

      toast.success(response.message || "Teacher updated successfully.");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update the teacher record."));
    },
  });

  const archiveTeacherMutation = useMutation({
    mutationFn: archiveTeacher,
    onSuccess: (response) => {
      const archivedTeacher = response.data;

      queryClient.invalidateQueries({ queryKey: ["teachers"] });

      if (archivedTeacher?.id) {
        queryClient.invalidateQueries({ queryKey: ["teachers", "detail", archivedTeacher.id] });
      }

      if (selectedTeacher?.id === archivedTeacher?.id) {
        setSelectedTeacher(archivedTeacher);
        setIsProfileOpen(false);
      }

      toast.success(response.message || "Teacher archived successfully.");
      setArchiveTarget(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to archive the teacher record."));
    },
  });

  const isInitialLoading = metaQuery.isPending || overviewQuery.isPending || teachersQuery.isPending;
  const errorMessage = buildTeachersWorkspaceError([
    { label: "Teachers meta", ...metaQuery },
    { label: "Teachers overview", ...overviewQuery },
    { label: "Teachers list", ...teachersQuery },
  ]);

  const overviewTeachers = useMemo(() => overviewQuery.data?.data || [], [overviewQuery.data]);
  const filteredTeachers = useMemo(() => teachersQuery.data?.data || [], [teachersQuery.data]);
  const subjects = useMemo(() => metaQuery.data?.subjects || [], [metaQuery.data]);
  const classes = useMemo(() => metaQuery.data?.classes || [], [metaQuery.data]);
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
  const subjectFormOptions = useMemo(
    () => [
      { value: "", label: "No subject yet" },
      ...subjects.map((subject) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
      })),
    ],
    [subjects],
  );
  const classOptions = useMemo(
    () => [
      { value: "", label: "No class yet" },
      ...classes.map((schoolClass) => ({
        value: schoolClass.id,
        label: getClassLabel(schoolClass),
      })),
    ],
    [classes],
  );

  const summaryCards = useMemo(() => {
    const activeTeachers = overviewTeachers.filter((teacher) => teacher.isActive).length;
    const homeroomCoverage = overviewTeachers.filter((teacher) => teacher.primaryHomeroomClass).length;
    const subjectAllocations = overviewTeachers.reduce(
      (total, teacher) => total + teacher.allocationSummary.subjectAssignmentsCount,
      0,
    );

    return [
      { label: "Active Teachers", value: String(activeTeachers), detail: "Staff accounts currently available" },
      { label: "Homeroom Coverage", value: String(homeroomCoverage), detail: "Teachers assigned to a class lead" },
      {
        label: "Subject Allocations",
        value: String(subjectAllocations),
        detail: "Current subject ownership mapped on live records",
      },
    ];
  }, [overviewTeachers]);

  const recentTeachers = useMemo(() => overviewTeachers.slice(0, 3), [overviewTeachers]);
  const allocationWatch = useMemo(
    () =>
      overviewTeachers
        .filter(
          (teacher) =>
            !teacher.primarySubjectAssignment || !teacher.primaryHomeroomClass || !teacher.qualification,
        )
        .slice(0, 3),
    [overviewTeachers],
  );

  const selectedTeacherProfile = teacherDetailQuery.data || selectedTeacher;

  function openTeacherProfile(teacher) {
    setSelectedTeacher(teacher);
    setIsProfileOpen(true);
  }

  function openEditModal(teacher) {
    setSelectedTeacher(teacher);
    setEditForm(getDefaultTeacherForm(teacher));
    setIsProfileOpen(false);
    setIsEditOpen(true);
  }

  function closeTeacherProfile() {
    setIsProfileOpen(false);
    setSelectedTeacher(null);
  }

  function closeEditModal() {
    if (!updateTeacherMutation.isPending) {
      setIsEditOpen(false);
    }
  }

  function openCreateModal() {
    setTeacherForm(getDefaultTeacherForm());
    setIsCreateOpen(true);
  }

  function updateCreateForm(field, value) {
    setTeacherForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "subjectId" && !value) {
        next.assignmentClassId = "";
      }

      return next;
    });
  }

  function updateEditForm(field, value) {
    setEditForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "subjectId" && !value) {
        next.assignmentClassId = "";
      }

      return next;
    });
  }

  function submitTeacherCreate() {
    const requiredFields = [
      teacherForm.firstName,
      teacherForm.lastName,
      teacherForm.email,
      teacherForm.password,
      teacherForm.employeeCode,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      toast.error("Complete the required teacher account fields before saving.");
      return;
    }

    createTeacherMutation.mutate(buildTeacherPayload(teacherForm));
  }

  function submitTeacherEdit() {
    const requiredFields = [editForm.firstName, editForm.lastName, editForm.email, editForm.employeeCode];

    if (requiredFields.some((value) => !value.trim())) {
      toast.error("Complete the required teacher profile fields before saving.");
      return;
    }

    updateTeacherMutation.mutate({
      teacherId: selectedTeacher.id,
      payload: buildTeacherUpdatePayload(editForm),
    });
  }

  function submitTeacherArchive() {
    if (!archiveTarget?.id) {
      return;
    }

    archiveTeacherMutation.mutate(archiveTarget.id);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setSubjectFilter("ALL");
  }

  if (isInitialLoading) {
    return <TeachersLoadingState />;
  }

  if (metaQuery.isError || overviewQuery.isError || teachersQuery.isError) {
    return (
      <TeachersErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          overviewQuery.refetch();
          teachersQuery.refetch();
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
          <p className="eyebrow">Teacher Management</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
            Teacher records, allocations, and classroom ownership now run on live staff data.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This workspace is connected to the backend teacher module. Staff search, creation,
            profile review, and safe archiving now work against real server records.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="primary-button inline-flex items-center gap-2"
            >
              <UserPlus size={17} />
              <span>Create teacher</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Advanced allocation mapping can be expanded next.")}
              className="secondary-button inline-flex items-center gap-2"
            >
              <BookOpen size={17} />
              <span>Review allocations</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Recent Teachers</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Latest staff records
              </h2>
            </div>
            <UsersRound className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {recentTeachers.length ? (
              recentTeachers.map((teacher) => (
                <div key={teacher.id} className="subtle-card rounded-[24px] p-4">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {teacher.fullName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                    {teacher.employeeCode} / {teacher.primarySubjectAssignment?.subject.name || "No subject yet"}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className={`status-chip ${getTeacherStatusChipClass(teacher.isActive)}`}>
                      {teacher.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <button type="button" className="chip-button" onClick={() => openTeacherProfile(teacher)}>
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No teacher records are available yet. Use the create form to add the first staff
                member.
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
            <p className="eyebrow">Roster Controls</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
              Search and filter the live teacher list
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Department filters and workload signals can be added next.")}
            className="chip-button inline-flex items-center gap-2 self-start xl:self-auto"
          >
            <ShieldCheck size={16} />
            <span>Open staffing watchlist</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Search teacher or code</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input"
              placeholder="Amina, EMP-2026-001, Mathematics..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Account status</span>
            <AppSelect value={statusFilter} onChange={setStatusFilter} options={teacherStatusOptions} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect value={subjectFilter} onChange={setSubjectFilter} options={subjectFilterOptions} />
          </label>

          <div className="flex items-end">
            <button type="button" onClick={resetFilters} className="secondary-button w-full">
              Reset filters
            </button>
          </div>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.22 })}
          className="surface-card overflow-hidden rounded-[30px]"
        >
          <div className="flex flex-col gap-4 border-b border-[rgba(8,39,95,0.08)] px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Staff Roster</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Teachers matching your filters
              </h2>
            </div>
            <span className="status-chip status-chip--blue">
              {teachersQuery.data?.total ?? filteredTeachers.length} records
            </span>
          </div>

          <div className="table-scroll-area">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Contact</th>
                  <th>Qualification</th>
                  <th>Allocation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">{teacher.fullName}</p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            Employee {teacher.employeeCode}
                            <span className="px-1.5">/</span>
                            Added {format(new Date(teacher.createdAt), "dd MMM yyyy")}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-[var(--ink-900)]">{teacher.email}</p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            {teacher.phoneNumber || "Phone not saved"}
                          </p>
                        </div>
                      </td>
                      <td>{teacher.qualification || "Not recorded"}</td>
                      <td>
                        <div>
                          <p className="font-medium text-[var(--ink-900)]">
                            {teacher.primarySubjectAssignment?.subject.name || "No subject yet"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            Homeroom {getClassLabel(teacher.primaryHomeroomClass)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip ${getTeacherStatusChipClass(teacher.isActive)}`}>
                          {teacher.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td>
                        <RowActionsMenu
                          label={`Open actions for ${teacher.fullName}`}
                          actions={[
                            {
                              label: "View",
                              icon: Eye,
                              onSelect: () => openTeacherProfile(teacher),
                            },
                            {
                              label: "Edit",
                              icon: PencilLine,
                              onSelect: () => openEditModal(teacher),
                            },
                            {
                              label: "Archive",
                              icon: Archive,
                              tone: "danger",
                              onSelect: () => setArchiveTarget(teacher),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--ink-700)]">
                      No teachers matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 24, delay: 0.26 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Allocation Watch</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Follow-up staff items
              </h2>
            </div>
            <BriefcaseBusiness className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {allocationWatch.length ? (
              allocationWatch.map((teacher) => (
                <div key={teacher.id} className="subtle-card rounded-[24px] p-5">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {teacher.fullName}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-[var(--ink-700)]">
                    <p>{teacher.primarySubjectAssignment?.subject.name || "Subject assignment still pending"}</p>
                    <p>{teacher.qualification || "Qualification record still missing"}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="status-chip status-chip--blue">
                      {teacher.primaryHomeroomClass ? getClassLabel(teacher.primaryHomeroomClass) : "No homeroom"}
                    </span>
                    <button type="button" className="chip-button" onClick={() => openTeacherProfile(teacher)}>
                      View profile
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                Current teacher allocations look healthy. New follow-up items will appear here.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isProfileOpen}
        onClose={closeTeacherProfile}
        size="wide"
        title={selectedTeacherProfile?.fullName || "Teacher profile"}
        description="Review the live teacher profile, current allocations, recent assessments, and attendance ownership."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={closeTeacherProfile}>
              Close
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => openEditModal(selectedTeacherProfile)}
              disabled={!selectedTeacherProfile}
            >
              Edit teacher
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                toast.success(
                  `Staff communication tools for ${selectedTeacherProfile?.fullName || "this teacher"} can be wired next.`,
                )
              }
              disabled={!selectedTeacherProfile}
            >
              Contact teacher
            </button>
          </>
        }
      >
        {teacherDetailQuery.isPending ? (
          <TeacherProfileLoadingState />
        ) : teacherDetailQuery.isError ? (
          <TeacherProfileErrorState
            message={getApiErrorMessage(
              teacherDetailQuery.error,
              "Refresh the teacher profile or verify the backend connection.",
            )}
            onRetry={() => teacherDetailQuery.refetch()}
          />
        ) : selectedTeacherProfile ? (
          <div className="space-y-6">
            <div className="subtle-card rounded-[24px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="eyebrow">Teacher Snapshot</p>
                  <h3 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                    {selectedTeacherProfile.fullName}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-700)]">
                    Employee code {selectedTeacherProfile.employeeCode}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`status-chip ${getTeacherStatusChipClass(selectedTeacherProfile.isActive)}`}>
                    {selectedTeacherProfile.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className="status-chip status-chip--blue">
                    {selectedTeacherProfile.primarySubjectAssignment?.subject.name || "No subject yet"}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--ink-700)]">
                Profile created on {formatDateLabel(selectedTeacherProfile.createdAt)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Email</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">{selectedTeacherProfile.email}</p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Phone</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedTeacherProfile.phoneNumber || "Not recorded"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  Qualification
                </p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedTeacherProfile.qualification || "Not recorded"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  Account State
                </p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedTeacherProfile.isActive ? "Active account" : "Inactive account"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  Homeroom Class
                </p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {getClassLabel(selectedTeacherProfile.primaryHomeroomClass)}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                  Current Subject
                </p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedTeacherProfile.primarySubjectAssignment
                    ? `${selectedTeacherProfile.primarySubjectAssignment.subject.name} (${selectedTeacherProfile.primarySubjectAssignment.subject.code})`
                    : "Not assigned"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="subtle-card rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Allocations</p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                      Subject assignments
                    </h3>
                  </div>
                  <span className="status-chip status-chip--blue">
                    {selectedTeacherProfile.subjectAssignments?.length || 0} entries
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedTeacherProfile.subjectAssignments?.length ? (
                    selectedTeacherProfile.subjectAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-[var(--ink-900)]">{assignment.subject.name}</p>
                            <p className="mt-1 text-sm text-[var(--ink-700)]">
                              {assignment.subject.code} / {getClassLabel(assignment.schoolClass)}
                            </p>
                          </div>
                          <span className="status-chip status-chip--green">ACTIVE</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[rgba(8,39,95,0.12)] px-4 py-5 text-sm text-[var(--ink-700)]">
                      No subject assignments are available yet for this teacher.
                    </div>
                  )}
                </div>
              </div>

              <div className="subtle-card rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Assessments</p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                      Recent authored work
                    </h3>
                  </div>
                  <span className="status-chip status-chip--blue">
                    {selectedTeacherProfile.recentAssessments?.length || 0} entries
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedTeacherProfile.recentAssessments?.length ? (
                    selectedTeacherProfile.recentAssessments.map((assessment) => (
                      <div
                        key={assessment.id}
                        className="rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-[var(--ink-900)]">{assessment.title}</p>
                            <p className="mt-1 text-sm text-[var(--ink-700)]">
                              {assessment.subject.name} / {getClassLabel(assessment.schoolClass)}
                            </p>
                          </div>
                          <span className={`status-chip ${getAssessmentStatusChipClass(assessment.status)}`}>
                            {assessment.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--ink-700)]">
                          {assessment.type} / {assessment.academicYear} / Due {formatDateLabel(assessment.dueDate)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[rgba(8,39,95,0.12)] px-4 py-5 text-sm text-[var(--ink-700)]">
                      No authored assessments are available yet for this teacher.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="subtle-card rounded-[24px] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Attendance Ownership</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                    Recent attendance entries
                  </h3>
                </div>
                <span className="status-chip status-chip--blue">
                  {selectedTeacherProfile.recentAttendanceOwnership?.length || 0} entries
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {selectedTeacherProfile.recentAttendanceOwnership?.length ? (
                  selectedTeacherProfile.recentAttendanceOwnership.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-[var(--ink-900)]">{entry.student.fullName}</p>
                        <p className="mt-1 text-sm text-[var(--ink-700)]">
                          {getClassLabel(entry.schoolClass)} / {formatDateLabel(entry.date)}
                        </p>
                      </div>
                      <span className={`status-chip ${getAttendanceStatusChipClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-[rgba(8,39,95,0.12)] px-4 py-5 text-sm text-[var(--ink-700)]">
                    No attendance ownership entries are available yet for this teacher.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={isEditOpen}
        onClose={closeEditModal}
        title="Edit teacher record"
        description="Update the teacher profile, core contact information, and current class or subject allocation."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={closeEditModal}
              disabled={updateTeacherMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitTeacherEdit}
              disabled={updateTeacherMutation.isPending || !selectedTeacher}
            >
              {updateTeacherMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">First name</span>
            <input
              value={editForm.firstName}
              onChange={(event) => updateEditForm("firstName", event.target.value)}
              className="form-input"
              placeholder="Amina"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Last name</span>
            <input
              value={editForm.lastName}
              onChange={(event) => updateEditForm("lastName", event.target.value)}
              className="form-input"
              placeholder="Mollel"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Employee code</span>
            <input
              value={editForm.employeeCode}
              onChange={(event) => updateEditForm("employeeCode", event.target.value)}
              className="form-input"
              placeholder="EMP-2026-004"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Email address</span>
            <input
              type="email"
              value={editForm.email}
              onChange={(event) => updateEditForm("email", event.target.value)}
              className="form-input"
              placeholder="teacher@educa.school"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Phone number</span>
            <input
              value={editForm.phoneNumber}
              onChange={(event) => updateEditForm("phoneNumber", event.target.value)}
              className="form-input"
              placeholder="+255..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Qualification</span>
            <input
              value={editForm.qualification}
              onChange={(event) => updateEditForm("qualification", event.target.value)}
              className="form-input"
              placeholder="B.Ed Mathematics"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Homeroom class</span>
            <AppSelect
              value={editForm.homeroomClassId}
              onChange={(value) => updateEditForm("homeroomClassId", value)}
              options={classOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect
              value={editForm.subjectId}
              onChange={(value) => updateEditForm("subjectId", value)}
              options={subjectFormOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Assigned class</span>
            <AppSelect
              value={editForm.assignmentClassId}
              onChange={(value) => updateEditForm("assignmentClassId", value)}
              options={classOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Account status</span>
            <AppSelect
              value={editForm.accountStatus}
              onChange={(value) => updateEditForm("accountStatus", value)}
              options={teacherStatusOptions.filter((option) => option.value !== "ALL")}
            />
          </label>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(archiveTarget)}
        onClose={() => {
          if (!archiveTeacherMutation.isPending) {
            setArchiveTarget(null);
          }
        }}
        title="Archive teacher record"
        description="This will deactivate the teacher account without deleting the staffing history."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setArchiveTarget(null)}
              disabled={archiveTeacherMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitTeacherArchive}
              disabled={archiveTeacherMutation.isPending}
            >
              {archiveTeacherMutation.isPending ? "Archiving..." : "Archive teacher"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="subtle-card rounded-[24px] p-5">
            <p className="eyebrow">Archive Confirmation</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink-900)]">
              {archiveTarget?.fullName}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
              Employee {archiveTarget?.employeeCode} will remain on record, but the account will
              become inactive and should no longer be used for new attendance or assessments.
            </p>
          </div>
          <div className="rounded-[18px] border border-dashed border-[rgba(180,35,66,0.18)] bg-[rgba(255,235,239,0.48)] px-4 py-4 text-sm leading-7 text-[var(--ink-700)]">
            Use archive instead of a hard delete. It is safer for audit history, authored work, and
            future reactivation if the staff member returns.
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={isCreateOpen}
        onClose={() => {
          if (!createTeacherMutation.isPending) {
            setIsCreateOpen(false);
          }
        }}
        title="Create teacher record"
        description="Create a real teacher account and optional starting class or subject allocation."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsCreateOpen(false)}
              disabled={createTeacherMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitTeacherCreate}
              disabled={createTeacherMutation.isPending}
            >
              {createTeacherMutation.isPending ? "Saving..." : "Create teacher"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">First name</span>
            <input
              value={teacherForm.firstName}
              onChange={(event) => updateCreateForm("firstName", event.target.value)}
              className="form-input"
              placeholder="Amina"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Last name</span>
            <input
              value={teacherForm.lastName}
              onChange={(event) => updateCreateForm("lastName", event.target.value)}
              className="form-input"
              placeholder="Mollel"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Employee code</span>
            <input
              value={teacherForm.employeeCode}
              onChange={(event) => updateCreateForm("employeeCode", event.target.value)}
              className="form-input"
              placeholder="EMP-2026-004"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Email address</span>
            <input
              type="email"
              value={teacherForm.email}
              onChange={(event) => updateCreateForm("email", event.target.value)}
              className="form-input"
              placeholder="teacher@educa.school"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Temporary password</span>
            <input
              value={teacherForm.password}
              onChange={(event) => updateCreateForm("password", event.target.value)}
              className="form-input"
              placeholder="Teacher@12345"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Phone number</span>
            <input
              value={teacherForm.phoneNumber}
              onChange={(event) => updateCreateForm("phoneNumber", event.target.value)}
              className="form-input"
              placeholder="+255..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Qualification</span>
            <input
              value={teacherForm.qualification}
              onChange={(event) => updateCreateForm("qualification", event.target.value)}
              className="form-input"
              placeholder="B.Ed Mathematics"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Homeroom class</span>
            <AppSelect
              value={teacherForm.homeroomClassId}
              onChange={(value) => updateCreateForm("homeroomClassId", value)}
              options={classOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Subject</span>
            <AppSelect
              value={teacherForm.subjectId}
              onChange={(value) => updateCreateForm("subjectId", value)}
              options={subjectFormOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Assigned class</span>
            <AppSelect
              value={teacherForm.assignmentClassId}
              onChange={(value) => updateCreateForm("assignmentClassId", value)}
              options={classOptions}
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
