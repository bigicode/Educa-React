import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { BellRing, Megaphone, MessageSquareMore, Send, UsersRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AppSelect } from "../../components/ui/AppSelect";
import { ModalShell } from "../../components/ui/ModalShell";
import { RowActionsMenu } from "../../components/ui/RowActionsMenu";
import { CardSkeleton, SkeletonBlock, SkeletonText } from "../../components/ui/Skeleton";
import { useAuth } from "../../features/auth/useAuth";
import {
  createAnnouncement,
  fetchCommunicationOverview,
  getApiErrorMessage,
  updateAnnouncement,
} from "../../features/communication/api";
import { getRevealMotion } from "../../lib/motion";

const audienceOptions = [
  { value: "ALL_SCHOOL", label: "All School" },
  { value: "STAFF", label: "Staff" },
  { value: "TEACHERS", label: "Teachers" },
  { value: "STUDENTS", label: "Students" },
  { value: "PARENTS", label: "Parents" },
];

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
];

function formatCommunicationDate(value, fallback = "Not scheduled") {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return format(parsedDate, "dd MMM yyyy");
}

function CommunicationLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-36 rounded-full" />
          <SkeletonBlock className="mb-4 h-12 w-2/3 rounded-2xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
        </div>
        <CardSkeleton className="rounded-[30px]" lines={4} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} lines={2} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <CardSkeleton className="rounded-[30px]" lines={6} />
        <CardSkeleton className="rounded-[30px]" lines={5} />
      </div>
    </div>
  );
}

function CommunicationErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Communication</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
        The communication workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-8" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function EmptyStateCard({ title, body }) {
  return (
    <div className="subtle-card rounded-[24px] p-5">
      <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{body}</p>
    </div>
  );
}

function getStatusChipClass(status) {
  return status === "PUBLISHED" ? "status-chip--blue" : "status-chip--cream";
}

const emptyForm = {
  title: "",
  body: "",
  audience: "ALL_SCHOOL",
  status: "DRAFT",
};

export function CommunicationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [editorMode, setEditorMode] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search);

  const overviewQuery = useQuery({
    queryKey: ["communication", "overview", deferredSearch, audience, status],
    queryFn: () =>
      fetchCommunicationOverview({
        ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
        ...(audience !== "ALL" ? { audience } : {}),
        ...(status !== "ALL" ? { status } : {}),
      }),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: (response) => {
      toast.success(response.message || "Announcement created successfully.");
      queryClient.invalidateQueries({ queryKey: ["communication"] });
      closeEditor();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not create the announcement."));
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ announcementId, payload }) => updateAnnouncement(announcementId, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Announcement updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["communication"] });
      closeEditor();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update the announcement."));
    },
  });

  const overview = overviewQuery.data;
  const announcements = overview?.announcements || [];
  const activityFeed = overview?.activityFeed || [];
  const audienceStats = overview?.audienceStats || [];
  const canManageAnnouncements = overview?.canManageAnnouncements;

  const stats = useMemo(
    () => [
      {
        label: "Published notices",
        value: String(overview?.summary?.publishedCount ?? 0),
        detail: "Broadcasts already visible to their target audiences",
        icon: Send,
      },
      {
        label: "Draft notices",
        value: String(overview?.summary?.draftCount ?? 0),
        detail: "Messages still waiting for review or publishing",
        icon: BellRing,
      },
      {
        label: "Audience coverage",
        value: String(overview?.summary?.audienceCoverage ?? 0),
        detail: "Distinct audience groups covered by current notices",
        icon: UsersRound,
      },
      {
        label: "Live activity",
        value: String(overview?.summary?.activityCount ?? 0),
        detail: "Signals from announcements, attendance, and assessments",
        icon: MessageSquareMore,
      },
    ],
    [overview],
  );

  const errorMessage = useMemo(
    () =>
      getApiErrorMessage(
        overviewQuery.error,
        "Check the backend connection and make sure the communication tables are available.",
      ),
    [overviewQuery.error],
  );

  function canEditAnnouncement(announcement) {
    if (!canManageAnnouncements) {
      return false;
    }

    if (user?.roleKey === "TEACHER") {
      return announcement.createdBy.id === user.id;
    }

    return true;
  }

  function openEditor(mode, announcement = null) {
    setEditorMode(mode);
    setSelectedAnnouncement(announcement);

    if (!announcement) {
      setFormState(emptyForm);
      return;
    }

    setFormState({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      status: announcement.status,
    });
  }

  function closeEditor() {
    setEditorMode(null);
    setSelectedAnnouncement(null);
    setFormState(emptyForm);
  }

  function updateForm(field, value) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitEditor() {
    if (editorMode === "edit" && selectedAnnouncement) {
      updateAnnouncementMutation.mutate({
        announcementId: selectedAnnouncement.id,
        payload: formState,
      });
      return;
    }

    createAnnouncementMutation.mutate(formState);
  }

  function handleQuickStatusChange(announcement, nextStatus) {
    updateAnnouncementMutation.mutate({
      announcementId: announcement.id,
      payload: { status: nextStatus },
    });
  }

  if (overviewQuery.isLoading) {
    return <CommunicationLoadingState />;
  }

  if (overviewQuery.isError) {
    return <CommunicationErrorState message={errorMessage} onRetry={overviewQuery.refetch} />;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18 })}
          className="surface-card-strong rounded-[30px] p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Communication</p>
              <h1 className="mt-3 page-title">
                Announcements and school delivery tracks are now real workspace data.
              </h1>
              <p className="page-copy mt-4 max-w-2xl">
                Create and manage notices, track live communication signals, and keep school-wide
                messaging in one place instead of scattered placeholders.
              </p>
            </div>

            {canManageAnnouncements ? (
              <button type="button" className="primary-button" onClick={() => openEditor("create")}>
                Create notice
              </button>
            ) : null}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 18, delay: 0.08 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Activity Track</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Live communication feed
              </h2>
            </div>
            <Megaphone className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {activityFeed.length ? (
              activityFeed.map((item) => (
                <div key={item.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.body}</p>
                    </div>
                    <span
                      className={[
                        "status-chip",
                        item.tone === "cream" ? "status-chip--cream" : "status-chip--blue",
                      ].join(" ")}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                    {item.time}
                  </p>
                </div>
              ))
            ) : (
              <EmptyStateCard
                title="No live communication signals yet"
                body="Activity from announcements, attendance, and assessments will appear here as the system grows."
              />
            )}
          </div>
        </motion.article>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.label}
              {...getRevealMotion(reduceMotion, { y: 16, delay: 0.06 + index * 0.04 })}
              className="kpi-card rounded-[28px] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                    {card.label}
                  </p>
                  <p className="kpi-value mt-3">{card.value}</p>
                  <p className="mt-3 text-sm text-[var(--ink-700)]">{card.detail}</p>
                </div>
                <div className="rounded-2xl bg-[var(--brand-blue-50)] p-3 text-[var(--brand-blue-700)]">
                  <Icon size={18} />
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <motion.article
        {...getRevealMotion(reduceMotion, { y: 18, delay: 0.12 })}
        className="surface-card rounded-[30px] p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.7fr_auto]">
          <label className="form-field">
            <span className="form-label">Search notices</span>
            <input
              className="form-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles or content"
            />
          </label>

          <label className="form-field">
            <span className="form-label">Audience</span>
            <AppSelect
              value={audience}
              onChange={setAudience}
              options={[{ value: "ALL", label: "All audiences" }, ...audienceOptions]}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Status</span>
            <AppSelect
              value={status}
              onChange={setStatus}
              options={[{ value: "ALL", label: "All statuses" }, ...statusOptions]}
            />
          </label>

          <button
            type="button"
            className="secondary-button mt-auto"
            onClick={() => {
              setSearch("");
              setAudience("ALL");
              setStatus("ALL");
            }}
          >
            Reset filters
          </button>
        </div>
      </motion.article>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.16 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Announcement Board</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Notices already in the system
              </h2>
            </div>
            <span className="status-chip status-chip--blue">{announcements.length} visible</span>
          </div>

          <div className="space-y-4">
            {announcements.length ? (
              announcements.map((announcement) => (
                <div key={announcement.id} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-xl font-semibold text-[var(--ink-900)]">
                          {announcement.title}
                        </h3>
                        <span className="status-chip status-chip--blue">{announcement.audienceLabel}</span>
                        <span className={["status-chip", getStatusChipClass(announcement.status)].join(" ")}>
                          {announcement.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">{announcement.body}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)]">
                        <span>By {announcement.createdBy.name}</span>
                        <span>Updated {formatCommunicationDate(announcement.updatedAt)}</span>
                        <span>
                          {announcement.publishedAt
                            ? `Published ${formatCommunicationDate(announcement.publishedAt)}`
                            : "Still in draft"}
                        </span>
                      </div>
                    </div>

                    <RowActionsMenu
                      label={`Announcement actions for ${announcement.title}`}
                      actions={[
                        {
                          id: "view",
                          label: "View",
                          onSelect: () => openEditor("view", announcement),
                        },
                        ...(canEditAnnouncement(announcement)
                          ? [
                              {
                                id: "edit",
                                label: "Edit",
                                onSelect: () => openEditor("edit", announcement),
                              },
                              {
                                id: announcement.status === "PUBLISHED" ? "draft" : "publish",
                                label:
                                  announcement.status === "PUBLISHED" ? "Return to draft" : "Publish",
                                onSelect: () =>
                                  handleQuickStatusChange(
                                    announcement,
                                    announcement.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                                  ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard
                title="No announcements match these filters"
                body="Try clearing the filters or create the first notice for this audience."
              />
            )}
          </div>
        </motion.article>

        <motion.article
          {...getRevealMotion(reduceMotion, { y: 22, delay: 0.2 })}
          className="surface-card rounded-[30px] p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Audience Reach</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--ink-900)]">
                Which groups are receiving notices
              </h2>
            </div>
            <UsersRound className="text-[var(--brand-blue-700)]" size={20} />
          </div>

          <div className="mt-6 space-y-4">
            {audienceStats.length ? (
              audienceStats.map((item) => (
                <div key={item.audience} className="subtle-card rounded-[24px] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {item.audienceLabel}
                      </p>
                      <p className="mt-2 text-sm text-[var(--ink-700)]">
                        {item.published} published, {item.draft} draft
                      </p>
                    </div>
                    <span className="status-chip status-chip--blue">{item.total}</span>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-[rgba(8,39,95,0.08)]">
                    <div
                      className="h-2 rounded-full bg-[var(--brand-blue-700)]"
                      style={{
                        width: `${Math.max(
                          12,
                          Math.round((item.total / Math.max(overview?.summary?.totalAnnouncements || 1, 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard
                title="No audience breakdown yet"
                body="Once announcements exist, audience coverage will appear here."
              />
            )}
          </div>
        </motion.article>
      </div>

      <ModalShell
        open={Boolean(editorMode)}
        onClose={closeEditor}
        title={
          editorMode === "create"
            ? "Create announcement"
            : editorMode === "edit"
              ? "Edit announcement"
              : "View announcement"
        }
        description="Use announcements for school-wide broadcasts, staff notices, and targeted communication."
        footer={
          editorMode === "view" ? (
            <button type="button" className="secondary-button" onClick={closeEditor}>
              Close
            </button>
          ) : (
            <>
              <button type="button" className="secondary-button" onClick={closeEditor}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={submitEditor}
                disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
              >
                {editorMode === "edit" ? "Save changes" : "Create notice"}
              </button>
            </>
          )
        }
      >
        <div className="grid gap-4">
          <label className="form-field">
            <span className="form-label">Audience</span>
            <AppSelect
              value={formState.audience}
              onChange={(value) => updateForm("audience", value)}
              options={audienceOptions}
              disabled={editorMode === "view"}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Status</span>
            <AppSelect
              value={formState.status}
              onChange={(value) => updateForm("status", value)}
              options={statusOptions}
              disabled={editorMode === "view"}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Title</span>
            <input
              className="form-input"
              value={formState.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Short notice title"
              disabled={editorMode === "view"}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Message</span>
            <textarea
              className="form-input min-h-36 resize-y"
              value={formState.body}
              onChange={(event) => updateForm("body", event.target.value)}
              placeholder="Write the announcement body"
              disabled={editorMode === "view"}
            />
          </label>
        </div>
      </ModalShell>
    </section>
  );
}
