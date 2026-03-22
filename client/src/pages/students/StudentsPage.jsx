import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import {
  Archive,
  CircleAlert,
  Download,
  Eye,
  Mail,
  PencilLine,
  Phone,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ModalShell } from "../../components/ui/ModalShell";
import { AppSelect } from "../../components/ui/AppSelect";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import {
  archiveStudent,
  createStudent,
  fetchStudentById,
  fetchStudentMeta,
  fetchStudents,
  getApiErrorMessage,
  updateStudent,
} from "../../features/students/api";
import { getRevealMotion } from "../../lib/motion";

const enrollmentStatusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "ARCHIVED", label: "Archived" },
];

function getClassLabel(enrollment) {
  if (!enrollment?.schoolClass) {
    return "Not assigned";
  }

  const { name, section } = enrollment.schoolClass;
  return section ? `${name} ${section}` : name;
}

function getStatusChipClass(status) {
  switch (status) {
    case "ACTIVE":
      return "status-chip--green";
    case "TRANSFERRED":
      return "status-chip--cream";
    case "GRADUATED":
      return "status-chip--blue";
    case "ARCHIVED":
      return "status-chip--rose";
    default:
      return "status-chip--cream";
  }
}

function getAttendanceChipClass(status) {
  switch (status) {
    case "PRESENT":
      return "status-chip--green";
    case "LATE":
      return "status-chip--cream";
    case "EXCUSED":
      return "status-chip--blue";
    case "ABSENT":
      return "status-chip--rose";
    default:
      return "status-chip--cream";
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

function formatMarks(value) {
  if (value === null || value === undefined || value === "") {
    return "Pending";
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? String(value) : `${numericValue.toFixed(0)}%`;
}

function getDefaultAdmissionForm(options) {
  const activeAcademicYear = options?.academicYears?.find((year) => year.isActive) || options?.academicYears?.[0];
  const firstClass = options?.classes?.[0];

  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "Student@12345",
    admissionNumber: "",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
    schoolClassId: firstClass?.id || "",
    academicYearId: activeAcademicYear?.id || "",
    enrollmentStatus: "ACTIVE",
  };
}

function getDefaultEditForm(student) {
  return {
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    email: student?.email || "",
    admissionNumber: student?.admissionNumber || "",
    dateOfBirth: student?.dateOfBirth ? format(new Date(student.dateOfBirth), "yyyy-MM-dd") : "",
    guardianName: student?.guardianName || "",
    guardianPhone: student?.guardianPhone || "",
    schoolClassId: student?.currentEnrollment?.schoolClass?.id || "",
    academicYearId: student?.currentEnrollment?.academicYearId || "",
    enrollmentStatus: student?.currentEnrollment?.status || "ACTIVE",
  };
}

function buildStudentPayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
    admissionNumber: form.admissionNumber.trim(),
    ...(form.dateOfBirth ? { dateOfBirth: new Date(`${form.dateOfBirth}T00:00:00`).toISOString() } : {}),
    ...(form.guardianName.trim() ? { guardianName: form.guardianName.trim() } : {}),
    ...(form.guardianPhone.trim() ? { guardianPhone: form.guardianPhone.trim() } : {}),
    ...(form.schoolClassId ? { schoolClassId: form.schoolClassId } : {}),
    ...(form.academicYearId ? { academicYearId: form.academicYearId } : {}),
    ...(form.enrollmentStatus ? { enrollmentStatus: form.enrollmentStatus } : {}),
  };
}

function buildStudentUpdatePayload(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    admissionNumber: form.admissionNumber.trim(),
    dateOfBirth: form.dateOfBirth ? new Date(`${form.dateOfBirth}T00:00:00`).toISOString() : null,
    guardianName: form.guardianName.trim() || null,
    guardianPhone: form.guardianPhone.trim() || null,
    ...(form.schoolClassId ? { schoolClassId: form.schoolClassId } : {}),
    ...(form.academicYearId ? { academicYearId: form.academicYearId } : {}),
    ...(form.enrollmentStatus ? { enrollmentStatus: form.enrollmentStatus } : {}),
  };
}

function StudentsLoadingState() {
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

function StudentsErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Students</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
        The student workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function buildStudentsWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the imported database, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

function StudentProfileLoadingState() {
  return (
    <div className="space-y-5">
      <div className="subtle-card rounded-[24px] p-5">
        <SkeletonBlock className="h-4 w-32 rounded-full" />
        <SkeletonBlock className="mt-4 h-10 w-2/3 rounded-2xl" />
        <SkeletonText lines={2} className="mt-4" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
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

function StudentProfileErrorState({ message, onRetry }) {
  return (
    <div className="subtle-card rounded-[24px] p-6">
      <p className="eyebrow">Student Profile</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-[var(--ink-900)]">
        The student profile could not load.
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="secondary-button mt-5" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function StudentsPage() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [admissionForm, setAdmissionForm] = useState(getDefaultAdmissionForm());
  const [editForm, setEditForm] = useState(getDefaultEditForm());
  const [archiveTarget, setArchiveTarget] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const studentFilters = useMemo(
    () => ({
      ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(classFilter !== "ALL" ? { schoolClassId: classFilter } : {}),
    }),
    [classFilter, deferredSearch, statusFilter],
  );

  const metaQuery = useQuery({
    queryKey: ["students", "meta"],
    queryFn: fetchStudentMeta,
  });

  const overviewQuery = useQuery({
    queryKey: ["students", "overview"],
    queryFn: () => fetchStudents(),
  });

  const studentsQuery = useQuery({
    queryKey: ["students", "list", studentFilters],
    queryFn: () => fetchStudents(studentFilters),
    placeholderData: (previousData) => previousData,
  });

  const studentDetailQuery = useQuery({
    queryKey: ["students", "detail", selectedStudent?.id],
    queryFn: () => fetchStudentById(selectedStudent.id),
    enabled: Boolean(isProfileOpen && selectedStudent?.id),
  });

  const createStudentMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success(response.message || "Student created successfully.");
      setIsModalOpen(false);
      setAdmissionForm(getDefaultAdmissionForm(metaQuery.data));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create the student record."));
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, payload }) => updateStudent(studentId, payload),
    onSuccess: (response) => {
      const updatedStudent = response.data;

      queryClient.invalidateQueries({ queryKey: ["students"] });

      if (updatedStudent?.id) {
        queryClient.invalidateQueries({ queryKey: ["students", "detail", updatedStudent.id] });
        setSelectedStudent(updatedStudent);
      }

      toast.success(response.message || "Student updated successfully.");
      setIsEditOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update the student record."));
    },
  });

  const archiveStudentMutation = useMutation({
    mutationFn: archiveStudent,
    onSuccess: (response) => {
      const archivedStudent = response.data;

      queryClient.invalidateQueries({ queryKey: ["students"] });

      if (archivedStudent?.id) {
        queryClient.invalidateQueries({ queryKey: ["students", "detail", archivedStudent.id] });
      }

      if (selectedStudent?.id === archivedStudent?.id) {
        setSelectedStudent(archivedStudent);
        setIsProfileOpen(false);
      }

      toast.success(response.message || "Student archived successfully.");
      setArchiveTarget(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to archive the student record."));
    },
  });

  const isInitialLoading = metaQuery.isPending || overviewQuery.isPending || studentsQuery.isPending;

  const errorMessage = buildStudentsWorkspaceError([
    { label: "Students meta", ...metaQuery },
    { label: "Students overview", ...overviewQuery },
    { label: "Students list", ...studentsQuery },
  ]);

  const overviewStudents = useMemo(() => overviewQuery.data?.data || [], [overviewQuery.data]);
  const filteredStudents = useMemo(() => studentsQuery.data?.data || [], [studentsQuery.data]);
  const classes = useMemo(() => metaQuery.data?.classes || [], [metaQuery.data]);
  const academicYears = useMemo(() => metaQuery.data?.academicYears || [], [metaQuery.data]);
  const activeAcademicYear = academicYears.find((year) => year.isActive) || academicYears[0] || null;
  const classFilterOptions = useMemo(
    () => [
      { value: "ALL", label: "All classes" },
      ...classes.map((schoolClass) => ({
        value: schoolClass.id,
        label: schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name,
      })),
    ],
    [classes],
  );
  const preferredClassOptions = useMemo(
    () => [
      { value: "", label: "No class yet" },
      ...classes.map((schoolClass) => ({
        value: schoolClass.id,
        label: schoolClass.section ? `${schoolClass.name} ${schoolClass.section}` : schoolClass.name,
      })),
    ],
    [classes],
  );
  const academicYearOptions = useMemo(
    () => [
      { value: "", label: "Select academic year" },
      ...academicYears.map((year) => ({
        value: year.id,
        label: `${year.name}${year.id === activeAcademicYear?.id ? " (Active)" : ""}`,
      })),
    ],
    [academicYears, activeAcademicYear],
  );
  const enrollmentCreateOptions = useMemo(
    () => enrollmentStatusOptions.filter((option) => option.value !== "ALL"),
    [],
  );

  const summaryCards = useMemo(() => {
    const activeStudents = overviewStudents.filter(
      (student) => student.currentEnrollment?.status === "ACTIVE",
    ).length;
    const withoutClass = overviewStudents.filter((student) => !student.currentEnrollment).length;
    const missingGuardianContact = overviewStudents.filter(
      (student) => !student.guardianName || !student.guardianPhone,
    ).length;

    return [
      { label: "Active Students", value: String(activeStudents), detail: "Currently enrolled and active" },
      { label: "Without Class", value: String(withoutClass), detail: "Need class assignment or enrollment" },
      {
        label: "Missing Contacts",
        value: String(missingGuardianContact),
        detail: "Guardian follow-up details still incomplete",
      },
    ];
  }, [overviewStudents]);

  const recentStudents = useMemo(() => overviewStudents.slice(0, 3), [overviewStudents]);
  const guardianContacts = useMemo(
    () => overviewStudents.filter((student) => student.guardianName || student.guardianPhone).slice(0, 3),
    [overviewStudents],
  );

  const selectedStudentProfile = studentDetailQuery.data || selectedStudent;

  function openStudentProfile(student) {
    setSelectedStudent(student);
    setIsProfileOpen(true);
  }

  function openEditModal(student) {
    setSelectedStudent(student);
    setEditForm(getDefaultEditForm(student));
    setIsProfileOpen(false);
    setIsEditOpen(true);
  }

  function closeStudentProfile() {
    setIsProfileOpen(false);
    setSelectedStudent(null);
  }

  function closeEditModal() {
    if (!updateStudentMutation.isPending) {
      setIsEditOpen(false);
    }
  }

  function openAdmissionModal() {
    setAdmissionForm(getDefaultAdmissionForm(metaQuery.data));
    setIsModalOpen(true);
  }

  function updateAdmission(field, value) {
    setAdmissionForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitAdmission() {
    const requiredFields = [
      admissionForm.firstName,
      admissionForm.lastName,
      admissionForm.email,
      admissionForm.password,
      admissionForm.admissionNumber,
    ];

    if (requiredFields.some((value) => !value.trim())) {
      toast.error("Complete the required student account fields before saving.");
      return;
    }

    createStudentMutation.mutate(buildStudentPayload(admissionForm));
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setClassFilter("ALL");
  }

  function submitStudentEdit() {
    const requiredFields = [editForm.firstName, editForm.lastName, editForm.email, editForm.admissionNumber];

    if (requiredFields.some((value) => !value.trim())) {
      toast.error("Complete the required student profile fields before saving.");
      return;
    }

    updateStudentMutation.mutate({
      studentId: selectedStudent.id,
      payload: buildStudentUpdatePayload(editForm),
    });
  }

  function submitStudentArchive() {
    if (!archiveTarget?.id) {
      return;
    }

    archiveStudentMutation.mutate(archiveTarget.id);
  }

  if (isInitialLoading) {
    return <StudentsLoadingState />;
  }

  if (metaQuery.isError || overviewQuery.isError || studentsQuery.isError) {
    return (
      <StudentsErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          overviewQuery.refetch();
          studentsQuery.refetch();
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
          <p className="eyebrow">Student Administration</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
            Admissions, roster review, and follow-up now run on live student records.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This workspace is now connected to the backend student module. Search, filtering, and
            admission capture work against real server data instead of static mock records.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openAdmissionModal}
              className="primary-button inline-flex items-center gap-2"
            >
              <UserPlus size={17} />
              <span>New admission</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Roster export can be wired to CSV next.")}
              className="secondary-button inline-flex items-center gap-2"
            >
              <Download size={17} />
              <span>Export roster</span>
            </button>
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Recent Students</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Latest records added
              </h2>
            </div>
            <UsersRound className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {recentStudents.length ? (
              recentStudents.map((student) => (
                <div key={student.id} className="subtle-card rounded-[24px] p-4">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {student.fullName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                    {student.admissionNumber} • {getClassLabel(student.currentEnrollment)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className={`status-chip ${getStatusChipClass(student.currentEnrollment?.status || "ARCHIVED")}`}>
                      {student.currentEnrollment?.status || "PENDING"}
                    </span>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => openStudentProfile(student)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No student records are available yet. Use the admission form to create the first one.
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
              Search and filter the live student list
            </h2>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Attendance watchlists will connect after the attendance module is wired.")}
            className="chip-button inline-flex items-center gap-2 self-start xl:self-auto"
          >
            <CircleAlert size={16} />
            <span>Open watchlist</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">
              Search student or guardian
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="form-input"
              placeholder="Neema, guardian, admission no..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Enrollment status</span>
            <AppSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={enrollmentStatusOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <AppSelect
              value={classFilter}
              onChange={setClassFilter}
              options={classFilterOptions}
            />
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
              <p className="eyebrow">Roster Preview</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Students matching your filters
              </h2>
            </div>
            <span className="status-chip status-chip--blue">
              {studentsQuery.data?.total ?? filteredStudents.length} records
            </span>
          </div>

          <div className="table-scroll-area">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Guardian</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">{student.fullName}</p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            Admission {student.admissionNumber}
                            <span className="px-1.5">/</span>
                            Added {format(new Date(student.createdAt), "dd MMM yyyy")}
                          </p>
                        </div>
                      </td>
                      <td>{getClassLabel(student.currentEnrollment)}</td>
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">
                            {student.guardianName || "Not provided"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-500)]">
                            {student.guardianPhone || "No phone saved"}
                          </p>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <span
                          className={`status-chip ${getStatusChipClass(
                            student.currentEnrollment?.status || "ARCHIVED",
                          )}`}
                        >
                          {student.currentEnrollment?.status || "PENDING"}
                        </span>
                      </td>
                      <td>
                        <RowActionsMenu
                          label={`Open actions for ${student.fullName}`}
                          actions={[
                            {
                              label: "View",
                              icon: Eye,
                              onSelect: () => openStudentProfile(student),
                            },
                            {
                              label: "Edit",
                              icon: PencilLine,
                              onSelect: () => openEditModal(student),
                            },
                            {
                              label: "Archive",
                              icon: Archive,
                              tone: "danger",
                              onSelect: () => setArchiveTarget(student),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--ink-700)]">
                      No students matched the current filters.
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
              <p className="eyebrow">Guardian Contact</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Quick follow-up
              </h2>
            </div>
            <Phone className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {guardianContacts.length ? (
              guardianContacts.map((student) => (
                <div key={student.id} className="subtle-card rounded-[24px] p-5">
                  <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                    {student.guardianName || "Guardian contact pending"}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-[var(--ink-700)]">
                    <p>{student.guardianPhone || "Phone not saved"}</p>
                    <p className="inline-flex items-center gap-2">
                      <Mail size={14} />
                      <span>{student.email}</span>
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="status-chip status-chip--blue">{student.fullName}</span>
                    <button
                      type="button"
                      className="chip-button"
                      onClick={() => openStudentProfile(student)}
                    >
                      View profile
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="subtle-card rounded-[24px] p-5 text-sm text-[var(--ink-700)]">
                No guardian contacts are available yet.
              </div>
            )}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isProfileOpen}
        onClose={closeStudentProfile}
        size="wide"
        title={selectedStudentProfile?.fullName || "Student profile"}
        description="Review the live student profile, current enrollment, recent attendance, and recent grade activity."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={closeStudentProfile}>
              Close
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => openEditModal(selectedStudentProfile)}
              disabled={!selectedStudentProfile}
            >
              Edit student
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                toast.success(
                  `Guardian follow-up for ${selectedStudentProfile?.fullName || "this student"} can be wired next.`,
                )
              }
              disabled={!selectedStudentProfile}
            >
              Contact guardian
            </button>
          </>
        }
      >
        {studentDetailQuery.isPending ? (
          <StudentProfileLoadingState />
        ) : studentDetailQuery.isError ? (
          <StudentProfileErrorState
            message={getApiErrorMessage(
              studentDetailQuery.error,
              "Refresh the student profile or verify the backend connection.",
            )}
            onRetry={() => studentDetailQuery.refetch()}
          />
        ) : selectedStudentProfile ? (
          <div className="space-y-6">
            <div className="subtle-card rounded-[24px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="eyebrow">Student Snapshot</p>
                  <h3 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                    {selectedStudentProfile.fullName}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-700)]">
                    Admission number {selectedStudentProfile.admissionNumber}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`status-chip ${getStatusChipClass(
                      selectedStudentProfile.currentEnrollment?.status || "ARCHIVED",
                    )}`}
                  >
                    {selectedStudentProfile.currentEnrollment?.status || "PENDING"}
                  </span>
                  <span className="status-chip status-chip--blue">
                    {getClassLabel(selectedStudentProfile.currentEnrollment)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--ink-700)]">
                Profile created on {formatDateLabel(selectedStudentProfile.createdAt)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Email</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">{selectedStudentProfile.email}</p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Date of Birth</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {formatDateLabel(selectedStudentProfile.dateOfBirth)}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Guardian</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedStudentProfile.guardianName || "Not recorded"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Guardian Phone</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedStudentProfile.guardianPhone || "Not recorded"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Academic Year</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedStudentProfile.currentEnrollment?.academicYear || "Not enrolled"}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">Account State</p>
                <p className="mt-3 font-semibold text-[var(--ink-900)]">
                  {selectedStudentProfile.isActive ? "Active account" : "Inactive account"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="subtle-card rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Attendance</p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                      Recent attendance
                    </h3>
                  </div>
                  <span className="status-chip status-chip--blue">
                    {selectedStudentProfile.recentAttendance?.length || 0} entries
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedStudentProfile.recentAttendance?.length ? (
                    selectedStudentProfile.recentAttendance.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[var(--ink-900)]">
                            {formatDateLabel(entry.date, "dd MMM yyyy")}
                          </p>
                          <p className="mt-1 text-sm text-[var(--ink-700)]">
                            {entry.remarks || "No attendance remarks added."}
                          </p>
                        </div>
                        <span className={`status-chip ${getAttendanceChipClass(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[rgba(8,39,95,0.12)] px-4 py-5 text-sm text-[var(--ink-700)]">
                      No attendance entries are available yet for this student.
                    </div>
                  )}
                </div>
              </div>

              <div className="subtle-card rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Assessment</p>
                    <h3 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                      Recent grades
                    </h3>
                  </div>
                  <span className="status-chip status-chip--blue">
                    {selectedStudentProfile.recentGrades?.length || 0} entries
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedStudentProfile.recentGrades?.length ? (
                    selectedStudentProfile.recentGrades.map((grade) => (
                      <div
                        key={grade.id}
                        className="rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-semibold text-[var(--ink-900)]">{grade.assessment.title}</p>
                            <p className="mt-1 text-sm text-[var(--ink-700)]">
                              {grade.assessment.subject} / {grade.assessment.type}
                            </p>
                          </div>
                          <span className="status-chip status-chip--green">{formatMarks(grade.marks)}</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--ink-700)]">
                          {grade.remarks || "No teacher remarks added yet."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[rgba(8,39,95,0.12)] px-4 py-5 text-sm text-[var(--ink-700)]">
                      No grades are available yet for this student.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={isEditOpen}
        onClose={closeEditModal}
        title="Edit student record"
        description="Update the student profile, enrollment details, and guardian contact information."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={closeEditModal}
              disabled={updateStudentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitStudentEdit}
              disabled={updateStudentMutation.isPending || !selectedStudent}
            >
              {updateStudentMutation.isPending ? "Saving..." : "Save changes"}
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
              placeholder="Neema"
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
            <span className="text-sm font-semibold text-[var(--ink-900)]">Admission number</span>
            <input
              value={editForm.admissionNumber}
              onChange={(event) => updateEditForm("admissionNumber", event.target.value)}
              className="form-input"
              placeholder="ADM-2026-001"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Email address</span>
            <input
              type="email"
              value={editForm.email}
              onChange={(event) => updateEditForm("email", event.target.value)}
              className="form-input"
              placeholder="student@educa.school"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Date of birth</span>
            <input
              type="date"
              value={editForm.dateOfBirth}
              onChange={(event) => updateEditForm("dateOfBirth", event.target.value)}
              className="form-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Preferred class</span>
            <AppSelect
              value={editForm.schoolClassId}
              onChange={(value) => updateEditForm("schoolClassId", value)}
              options={preferredClassOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Academic year</span>
            <AppSelect
              value={editForm.academicYearId}
              onChange={(value) => updateEditForm("academicYearId", value)}
              options={academicYearOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Enrollment status</span>
            <AppSelect
              value={editForm.enrollmentStatus}
              onChange={(value) => updateEditForm("enrollmentStatus", value)}
              options={enrollmentCreateOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian name</span>
            <input
              value={editForm.guardianName}
              onChange={(event) => updateEditForm("guardianName", event.target.value)}
              className="form-input"
              placeholder="Parent or guardian"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian phone</span>
            <input
              value={editForm.guardianPhone}
              onChange={(event) => updateEditForm("guardianPhone", event.target.value)}
              className="form-input"
              placeholder="+255..."
            />
          </label>
        </div>
      </ModalShell>

      <ModalShell
        open={Boolean(archiveTarget)}
        onClose={() => {
          if (!archiveStudentMutation.isPending) {
            setArchiveTarget(null);
          }
        }}
        title="Archive student record"
        description="This will deactivate the student account and mark current enrollments as archived without deleting the history."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setArchiveTarget(null)}
              disabled={archiveStudentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitStudentArchive}
              disabled={archiveStudentMutation.isPending}
            >
              {archiveStudentMutation.isPending ? "Archiving..." : "Archive student"}
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
              Admission {archiveTarget?.admissionNumber} will remain on record, but the account will become inactive
              and active enrollment tracking will stop.
            </p>
          </div>
          <div className="rounded-[18px] border border-dashed border-[rgba(180,35,66,0.18)] bg-[rgba(255,235,239,0.48)] px-4 py-4 text-sm leading-7 text-[var(--ink-700)]">
            Use this instead of a hard delete. It is safer for audit history, attendance, grades, and future record
            recovery.
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={isModalOpen}
        onClose={() => {
          if (!createStudentMutation.isPending) {
            setIsModalOpen(false);
          }
        }}
        title="Create student record"
        description="Create a real student account and optional enrollment from the admissions workspace."
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsModalOpen(false)}
              disabled={createStudentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={submitAdmission}
              disabled={createStudentMutation.isPending}
            >
              {createStudentMutation.isPending ? "Saving..." : "Create student"}
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">First name</span>
            <input
              value={admissionForm.firstName}
              onChange={(event) => updateAdmission("firstName", event.target.value)}
              className="form-input"
              placeholder="Neema"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Last name</span>
            <input
              value={admissionForm.lastName}
              onChange={(event) => updateAdmission("lastName", event.target.value)}
              className="form-input"
              placeholder="Mollel"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Admission number</span>
            <input
              value={admissionForm.admissionNumber}
              onChange={(event) => updateAdmission("admissionNumber", event.target.value)}
              className="form-input"
              placeholder="ADM-2026-004"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Email address</span>
            <input
              type="email"
              value={admissionForm.email}
              onChange={(event) => updateAdmission("email", event.target.value)}
              className="form-input"
              placeholder="student@educa.school"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Temporary password</span>
            <input
              value={admissionForm.password}
              onChange={(event) => updateAdmission("password", event.target.value)}
              className="form-input"
              placeholder="Student@12345"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Date of birth</span>
            <input
              type="date"
              value={admissionForm.dateOfBirth}
              onChange={(event) => updateAdmission("dateOfBirth", event.target.value)}
              className="form-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Preferred class</span>
            <AppSelect
              value={admissionForm.schoolClassId}
              onChange={(value) => updateAdmission("schoolClassId", value)}
              options={preferredClassOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Academic year</span>
            <AppSelect
              value={admissionForm.academicYearId}
              onChange={(value) => updateAdmission("academicYearId", value)}
              options={academicYearOptions}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian name</span>
            <input
              value={admissionForm.guardianName}
              onChange={(event) => updateAdmission("guardianName", event.target.value)}
              className="form-input"
              placeholder="Parent or guardian"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian phone</span>
            <input
              value={admissionForm.guardianPhone}
              onChange={(event) => updateAdmission("guardianPhone", event.target.value)}
              className="form-input"
              placeholder="+255..."
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Enrollment status</span>
            <AppSelect
              value={admissionForm.enrollmentStatus}
              onChange={(value) => updateAdmission("enrollmentStatus", value)}
              options={enrollmentCreateOptions}
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
