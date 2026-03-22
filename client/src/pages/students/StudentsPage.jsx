import { useDeferredValue, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "motion/react";
import { CircleAlert, Download, Phone, Search, UserPlus, UsersRound } from "lucide-react";
import { ModalShell } from "../../components/ui/ModalShell";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import { admissionsQueue, studentsList as students } from "../../data/schoolData";
import { useDemoLoading } from "../../hooks/useDemoLoading";
import { getRevealMotion } from "../../lib/motion";

const summaryCards = [
  { label: "Active Students", value: "1,248", detail: "41 new this month" },
  { label: "Waiting Documents", value: "12", detail: "Need registrar review" },
  { label: "Attendance Watch", value: "19", detail: "Below 90% today" },
];

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

export function StudentsPage() {
  const reduceMotion = useReducedMotion();
  const isLoading = useDemoLoading("students", 720);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    name: "",
    className: "Grade 7",
    guardian: "",
    phone: "",
  });
  const deferredSearch = useDeferredValue(search);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        student.guardian.toLowerCase().includes(deferredSearch.toLowerCase());
      const matchesStatus = statusFilter === "All" || student.status === statusFilter;
      const matchesClass = classFilter === "All" || student.className.includes(classFilter);

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [classFilter, deferredSearch, statusFilter]);

  function updateAdmission(field, value) {
    setAdmissionForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitAdmission() {
    if (!admissionForm.name.trim() || !admissionForm.guardian.trim() || !admissionForm.phone.trim()) {
      toast.error("Complete the admission form before saving.");
      return;
    }

    toast.success(`Admission draft created for ${admissionForm.name}.`);
    setIsModalOpen(false);
    setAdmissionForm({
      name: "",
      className: "Grade 7",
      guardian: "",
      phone: "",
    });
  }

  if (isLoading) {
    return <StudentsLoadingState />;
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
            Admissions, roster review, and follow-up now feel like real workspaces.
          </h1>
          <p className="page-copy mt-4 max-w-3xl">
            This module now supports a more realistic daily flow: search, roster review, risk
            tracking, and quick admission capture. It is also calmer visually, with cream used as
            a supporting tone instead of a full visual treatment.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsModalOpen(true)} className="primary-button inline-flex items-center gap-2">
              <UserPlus size={17} />
              <span>New admission</span>
            </button>
            <button
              type="button"
              onClick={() => toast.success("Student list export queued.")}
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
              <p className="eyebrow">Admissions Queue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Next students in review
              </h2>
            </div>
            <UsersRound className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {admissionsQueue.map((item) => (
              <div key={item.name} className="subtle-card rounded-[24px] p-4">
                <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.step}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="status-chip status-chip--cream">{item.owner}</span>
                  <button type="button" className="chip-button" onClick={() => toast.success(`Opened ${item.name}'s profile.`)}>
                    Review
                  </button>
                </div>
              </div>
            ))}
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
            onClick={() => toast.success("Attendance watchlist opened.")}
            className="chip-button inline-flex items-center gap-2 self-start xl:self-auto"
          >
            <CircleAlert size={16} />
            <span>Open watchlist</span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Search student or guardian</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="form-input pl-11"
                placeholder="Amina, Joseph, guardian..."
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="form-input">
              <option>All</option>
              <option>Excellent</option>
              <option>Good</option>
              <option>Watch</option>
              <option>Follow-up</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Class</span>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="form-input">
              <option>All</option>
              <option>Grade 7</option>
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setClassFilter("All");
              }}
              className="secondary-button w-full"
            >
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
            <span className="status-chip status-chip--blue">{filteredStudents.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table-shell min-w-full text-left">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Guardian</th>
                  <th>Attendance</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.name}>
                    <td className="font-semibold text-[var(--ink-900)]">{student.name}</td>
                    <td>{student.className}</td>
                    <td>
                      <div>
                        <p className="font-semibold text-[var(--ink-900)]">{student.guardian}</p>
                        <p className="mt-1 text-xs text-[var(--ink-500)]">{student.phone}</p>
                      </div>
                    </td>
                    <td>{student.attendance}</td>
                    <td>{student.balance}</td>
                    <td>
                      <span
                        className={[
                          "status-chip",
                          student.status === "Watch"
                            ? "status-chip--rose"
                            : student.status === "Follow-up"
                              ? "status-chip--cream"
                              : "status-chip--green",
                        ].join(" ")}
                      >
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
            {students.slice(0, 3).map((student) => (
              <div key={student.name} className="subtle-card rounded-[24px] p-5">
                <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                  {student.guardian}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-700)]">{student.phone}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="status-chip status-chip--blue">{student.name}</span>
                  <button
                    type="button"
                    className="chip-button"
                    onClick={() => toast.success(`Call reminder prepared for ${student.guardian}.`)}
                  >
                    Add reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create admission draft"
        description="Capture the first student details quickly, then continue with documents and approvals."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={submitAdmission}>
              Save draft
            </button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Student full name</span>
            <input
              value={admissionForm.name}
              onChange={(event) => updateAdmission("name", event.target.value)}
              className="form-input"
              placeholder="Example: Aisha Omary"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Preferred class</span>
            <select
              value={admissionForm.className}
              onChange={(event) => updateAdmission("className", event.target.value)}
              className="form-input"
            >
              <option>Grade 7</option>
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian name</span>
            <input
              value={admissionForm.guardian}
              onChange={(event) => updateAdmission("guardian", event.target.value)}
              className="form-input"
              placeholder="Parent or guardian"
            />
          </label>

          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-[var(--ink-900)]">Guardian phone</span>
            <input
              value={admissionForm.phone}
              onChange={(event) => updateAdmission("phone", event.target.value)}
              className="form-input"
              placeholder="+255..."
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
