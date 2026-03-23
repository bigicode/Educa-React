import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModalShell } from "../../components/ui/ModalShell";
import { AppSelect } from "../../components/ui/AppSelect";
import { CardSkeleton, SkeletonBlock, SkeletonText, TableSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../features/auth/useAuth";
import { fetchDashboardOverview, getApiErrorMessage } from "../../features/dashboard/api";
import { useReducedMotion } from "motion/react";
import toast from "react-hot-toast";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { TeacherDashboardView } from "./components/TeacherDashboardView";

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-32 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-3/4 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
            <CardSkeleton className="bg-white/75 p-5 shadow-none" lines={2} />
          </div>
        </div>

        <CardSkeleton className="rounded-[30px]" lines={5} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="surface-card rounded-[30px] p-6">
          <SkeletonBlock className="mb-4 h-4 w-36 rounded-full" />
          <SkeletonBlock className="mb-6 h-8 w-64 rounded-2xl" />
          <SkeletonBlock className="h-[280px] rounded-[26px]" />
        </div>
        <div className="surface-card rounded-[30px] p-6">
          <SkeletonBlock className="mb-4 h-4 w-28 rounded-full" />
          <SkeletonBlock className="mb-6 h-8 w-56 rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="subtle-card rounded-[24px] p-5">
                <SkeletonBlock className="mb-3 h-4 w-2/3 rounded-full" />
                <SkeletonText lines={2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <TableSkeleton />
    </div>
  );
}

function DashboardErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
        The dashboard overview could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-8" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    audience: "All School",
    title: "",
    message: "",
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: fetchDashboardOverview,
  });

  const scope = dashboardQuery.data?.scope || (user?.roleKey === "TEACHER" ? "TEACHER" : "ADMIN");

  const overviewErrorMessage = useMemo(
    () =>
      getApiErrorMessage(
        dashboardQuery.error,
        "Check the backend connection and make sure dashboard data is available.",
      ),
    [dashboardQuery.error],
  );

  function updateNotice(field, value) {
    setNoticeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitNotice() {
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      toast.error("Add both a subject and a message before sending.");
      return;
    }

    toast.success(`Notice prepared for ${noticeForm.audience.toLowerCase()}.`);
    setIsNoticeOpen(false);
    setNoticeForm({
      audience: "All School",
      title: "",
      message: "",
    });
  }

  if (dashboardQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError) {
    return <DashboardErrorState message={overviewErrorMessage} onRetry={dashboardQuery.refetch} />;
  }

  return (
    <section className="space-y-6">
      {scope === "TEACHER" ? (
        <TeacherDashboardView reduceMotion={reduceMotion} overview={dashboardQuery.data} />
      ) : (
        <AdminDashboardView
          reduceMotion={reduceMotion}
          overview={dashboardQuery.data}
          onOpenNotice={() => setIsNoticeOpen(true)}
        />
      )}

      <ModalShell
        open={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        title="Create school notice"
        description="Use this for announcements that need a quick but structured message workflow."
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setIsNoticeOpen(false)}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={submitNotice}>
              Prepare notice
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <label className="form-field">
            <span className="form-label">Audience</span>
            <AppSelect
              value={noticeForm.audience}
              onChange={(value) => updateNotice("audience", value)}
              options={[
                { value: "All School", label: "All School" },
                { value: "Staff", label: "Staff" },
                { value: "Parents", label: "Parents" },
              ]}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Subject</span>
            <input
              className="form-input"
              value={noticeForm.title}
              onChange={(event) => updateNotice("title", event.target.value)}
              placeholder="Short notice subject"
            />
          </label>

          <label className="form-field">
            <span className="form-label">Message</span>
            <textarea
              className="form-input min-h-32 resize-y"
              value={noticeForm.message}
              onChange={(event) => updateNotice("message", event.target.value)}
              placeholder="Write the announcement that will appear on the dashboard and notifications."
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
