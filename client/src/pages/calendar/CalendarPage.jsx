import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { motion, useReducedMotion } from "motion/react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  Sparkles,
} from "lucide-react";
import { AppSelect } from "../../components/ui/AppSelect";
import { ModalShell } from "../../components/ui/ModalShell";
import { CardSkeleton, SkeletonBlock, SkeletonText } from "../../components/ui/Skeleton";
import { useAuth } from "../../features/auth/useAuth";
import {
  fetchCalendarEvents,
  fetchCalendarMeta,
  getApiErrorMessage,
} from "../../features/calendar/api";
import { getRevealMotion } from "../../lib/motion";

const eventTypeConfig = {
  TERM_START: {
    label: "Term start",
    chartColor: "#0047ab",
    eventClassName: "calendar-event--term-start",
    accentClassName: "status-chip--blue",
  },
  TERM_END: {
    label: "Term end",
    chartColor: "#0b367e",
    eventClassName: "calendar-event--term-end",
    accentClassName: "status-chip--blue",
  },
  ASSESSMENT_DUE: {
    label: "Assessment due",
    chartColor: "#d5bc60",
    eventClassName: "calendar-event--assessment-due",
    accentClassName: "status-chip--cream",
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    chartColor: "#60a5fa",
    eventClassName: "calendar-event--announcement",
    accentClassName: "status-chip--blue",
  },
  ATTENDANCE_SESSION: {
    label: "Attendance",
    chartColor: "#16a34a",
    eventClassName: "calendar-event--attendance-session",
    accentClassName: "status-chip--green",
  },
};

const eventTypeOptions = [
  { value: "ALL", label: "All events" },
  { value: "TERM_START", label: "Term starts" },
  { value: "TERM_END", label: "Term ends" },
  { value: "ASSESSMENT_DUE", label: "Assessment due" },
  { value: "ANNOUNCEMENT", label: "Announcements" },
  { value: "ATTENDANCE_SESSION", label: "Attendance sessions" },
];

function getInitialRange() {
  const today = new Date();
  return {
    start: format(startOfMonth(today), "yyyy-MM-dd"),
    end: format(endOfMonth(today), "yyyy-MM-dd"),
    title: format(today, "MMMM yyyy"),
  };
}

function formatCalendarDate(value, fallback = "Not scheduled") {
  if (!value) {
    return fallback;
  }

  const parsedDate = typeof value === "string" ? parseISO(value) : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return format(parsedDate, "dd MMM yyyy");
}

function buildCalendarWorkspaceError(queries) {
  const failedQueries = queries.filter((query) => query.isError);

  if (!failedQueries.length) {
    return "Check the backend connection and the available calendar data, then try again.";
  }

  return failedQueries
    .map((query) => `${query.label}: ${getApiErrorMessage(query.error, "Request failed.")}`)
    .join(" ");
}

function CalendarLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
        <div className="surface-card-strong rounded-[30px] p-8">
          <SkeletonBlock className="mb-4 h-4 w-28 rounded-full" />
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

      <div className="surface-card rounded-[30px] p-6">
        <SkeletonBlock className="mb-5 h-4 w-40 rounded-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.32fr_0.68fr]">
        <CardSkeleton className="rounded-[30px]" lines={7} />
        <CardSkeleton className="rounded-[30px]" lines={6} />
      </div>
    </div>
  );
}

function CalendarErrorState({ message, onRetry }) {
  return (
    <div className="surface-card rounded-[30px] p-8">
      <p className="eyebrow">Calendar</p>
      <h1 className="mt-3 font-display text-4xl font-bold text-[var(--ink-900)]">
        The calendar workspace could not load.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ink-700)]">{message}</p>
      <button type="button" className="primary-button mt-8" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function CalendarChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(8,39,95,0.14)]">
      <p className="text-sm font-semibold text-[var(--ink-900)]">{item.name}</p>
      <p className="mt-1 text-sm text-[var(--ink-700)]">{item.value} events</p>
    </div>
  );
}

function EventSummaryCard({ label, value, detail, icon: Icon, delay, reduceMotion }) {
  return (
    <motion.div className="kpi-card rounded-[26px] p-5" {...getRevealMotion(reduceMotion, { delay })}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ink-700)]">{label}</p>
          <p className="kpi-value mt-3">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(0,71,171,0.08)] text-[var(--brand-blue-700)]">
          <Icon size={20} />
        </span>
      </div>
    </motion.div>
  );
}

function CalendarEventContent(arg) {
  const { event } = arg;
  const type = event.extendedProps?.rawEvent?.type;
  const typeConfig = eventTypeConfig[type] || eventTypeConfig.ANNOUNCEMENT;

  return (
    <div className={`calendar-event-chip ${typeConfig.eventClassName}`}>
      <span className="calendar-event-chip__title">{event.title}</span>
    </div>
  );
}

function renderDetailField(label, value) {
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className="subtle-card rounded-[22px] p-4">
      <p className="eyebrow !text-[0.68rem]">{label}</p>
      <p className="mt-3 text-sm font-semibold text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

export function CalendarPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const calendarRef = useRef(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [viewMode, setViewMode] = useState("dayGridMonth");
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [visibleRange, setVisibleRange] = useState(getInitialRange);

  const metaQuery = useQuery({
    queryKey: ["calendar", "meta"],
    queryFn: fetchCalendarMeta,
  });

  const academicYears = metaQuery.data?.academicYears || [];
  const classes = metaQuery.data?.classes || [];
  const activeAcademicYear = academicYears.find((year) => year.isActive) || academicYears[0] || null;
  const resolvedAcademicYearId = selectedAcademicYearId || activeAcademicYear?.id || "";

  const eventsQuery = useQuery({
    queryKey: [
      "calendar",
      "events",
      resolvedAcademicYearId,
      selectedClassId,
      visibleRange.start,
      visibleRange.end,
    ],
    queryFn: () =>
      fetchCalendarEvents({
        ...(resolvedAcademicYearId ? { academicYearId: resolvedAcademicYearId } : {}),
        ...(selectedClassId !== "ALL" ? { schoolClassId: selectedClassId } : {}),
        dateFrom: visibleRange.start,
        dateTo: visibleRange.end,
      }),
    enabled: Boolean(resolvedAcademicYearId),
    placeholderData: (previousData) => previousData,
  });

  const isInitialLoading = metaQuery.isPending || (eventsQuery.isPending && !eventsQuery.data);
  const errorMessage = buildCalendarWorkspaceError([
    { label: "Calendar meta", ...metaQuery },
    { label: "Calendar events", ...eventsQuery },
  ]);

  const calendarData = eventsQuery.data;
  const scope = calendarData?.scope || metaQuery.data?.scope || user?.roleKey || "SUPER_ADMIN";
  const isTeacher = scope === "TEACHER";
  const rawEvents = useMemo(() => calendarData?.events || [], [calendarData?.events]);
  const filteredEvents =
    selectedType === "ALL" ? rawEvents : rawEvents.filter((event) => event.type === selectedType);
  const selectedEvent = useMemo(
    () => rawEvents.find((event) => event.id === selectedEventId) || null,
    [rawEvents, selectedEventId],
  );

  const calendarEvents = useMemo(
    () =>
      filteredEvents.map((event) => {
        const typeConfig = eventTypeConfig[event.type] || eventTypeConfig.ANNOUNCEMENT;
        const computedEnd =
          event.allDay && event.end ? format(addDays(parseISO(event.end), 1), "yyyy-MM-dd") : event.end || undefined;

        return {
          id: event.id,
          title: event.title,
          start: event.start,
          end: computedEnd,
          allDay: event.allDay,
          classNames: ["calendar-event", typeConfig.eventClassName],
          extendedProps: {
            rawEvent: event,
          },
        };
      }),
    [filteredEvents],
  );

  const distributionData = useMemo(() => {
    const grouped = rawEvents.reduce((map, event) => {
      const current = map.get(event.type) || {
        type: event.type,
        name: eventTypeConfig[event.type]?.label || event.typeLabel || event.type,
        value: 0,
        color: eventTypeConfig[event.type]?.chartColor || "#60a5fa",
      };

      current.value += 1;
      map.set(event.type, current);
      return map;
    }, new Map());

    return Array.from(grouped.values()).sort((left, right) => right.value - left.value);
  }, [rawEvents]);

  const upcomingEvents = useMemo(() => {
    const source = selectedType === "ALL" ? rawEvents : filteredEvents;

    return source
      .filter((event) => event.start >= format(new Date(), "yyyy-MM-dd"))
      .sort((left, right) => left.start.localeCompare(right.start))
      .slice(0, 8);
  }, [filteredEvents, rawEvents, selectedType]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Upcoming events",
        value: String(selectedType === "ALL" ? calendarData?.summary?.upcomingCount ?? 0 : upcomingEvents.length),
        detail: "School moments still ahead in the visible date range",
        icon: CalendarDays,
      },
      {
        label: "Assessments due",
        value: String(calendarData?.summary?.assessmentCount ?? 0),
        detail: "Assessment deadlines already scheduled in this view",
        icon: GraduationCap,
      },
      {
        label: "Attendance logs",
        value: String(calendarData?.summary?.attendanceCount ?? 0),
        detail: "Attendance submissions already recorded on the calendar",
        icon: ClipboardCheck,
      },
      {
        label: "Announcements",
        value: String(calendarData?.summary?.announcementCount ?? 0),
        detail: "Published notices now visible on the shared timeline",
        icon: BellRing,
      },
    ],
    [calendarData?.summary, selectedType, upcomingEvents.length],
  );

  function handleCalendarDatesSet(arg) {
    setVisibleRange({
      start: format(arg.start, "yyyy-MM-dd"),
      end: format(addDays(arg.end, -1), "yyyy-MM-dd"),
      title: arg.view.title,
    });
  }

  function handleNavigate(action) {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    if (action === "prev") {
      api.prev();
      return;
    }

    if (action === "next") {
      api.next();
      return;
    }

    api.today();
  }

  function handleViewChange(nextView) {
    setViewMode(nextView);
    const api = calendarRef.current?.getApi();

    if (api) {
      api.changeView(nextView);
    }
  }

  function resetFilters() {
    setSelectedClassId("ALL");
    setSelectedType("ALL");
  }

  if (isInitialLoading) {
    return <CalendarLoadingState />;
  }

  if (metaQuery.isError || eventsQuery.isError) {
    return (
      <CalendarErrorState
        message={errorMessage}
        onRetry={() => {
          metaQuery.refetch();
          eventsQuery.refetch();
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
          <motion.section className="surface-card-strong rounded-[30px] p-8" {...getRevealMotion(reduceMotion)}>
            <p className="eyebrow">Calendar</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-tight text-[var(--ink-900)] md:text-[3.1rem]">
              A live school calendar built from real assessments, attendance, and announcements.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ink-700)]">
              This workspace shows the real academic timeline for the selected scope, so teachers and
              administrators can plan around deadlines, published notices, and daily operations without switching
              modules.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="info-pill rounded-full px-4 py-2 text-sm font-semibold">{visibleRange.title}</span>
              <span className="info-pill rounded-full px-4 py-2 text-sm font-semibold">
                {isTeacher ? "Teacher scope" : "Admin scope"}
              </span>
              <span className="info-pill rounded-full px-4 py-2 text-sm font-semibold">
                {calendarData?.filters?.academicYear?.name || activeAcademicYear?.name || "Academic year"}
              </span>
            </div>
          </motion.section>

          <motion.aside
            className="surface-card rounded-[30px] p-7"
            {...getRevealMotion(reduceMotion, { delay: 0.06 })}
          >
            <p className="eyebrow">Live Range</p>
            <h2 className="mt-4 font-display text-[2rem] font-bold leading-tight text-[var(--ink-900)]">
              {visibleRange.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-700)]">
              Events are loaded only for the current calendar view, which keeps the workspace fast while still
              surfacing the most relevant academic activity.
            </p>

            <div className="mt-6 space-y-4">
              <div className="subtle-card rounded-[22px] p-4">
                <p className="eyebrow !text-[0.68rem]">Visible Dates</p>
                <p className="mt-3 text-sm font-semibold text-[var(--ink-900)]">
                  {formatCalendarDate(visibleRange.start)} to {formatCalendarDate(visibleRange.end)}
                </p>
              </div>

              <div className="subtle-card rounded-[22px] p-4">
                <p className="eyebrow !text-[0.68rem]">Term Milestones</p>
                <p className="mt-3 text-sm font-semibold text-[var(--ink-900)]">
                  {calendarData?.summary?.termMilestoneCount ?? 0} timeline anchors in this view
                </p>
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <EventSummaryCard key={card.label} {...card} delay={0.04 * index} reduceMotion={reduceMotion} />
          ))}
        </div>

        <motion.section
          className="surface-card rounded-[30px] p-6"
          {...getRevealMotion(reduceMotion, { delay: 0.08 })}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Filters</p>
                <h2 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                  Keep the calendar focused on the work that matters now
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`secondary-button ${viewMode === "dayGridMonth" ? "secondary-button--active" : ""}`}
                  onClick={() => handleViewChange("dayGridMonth")}
                >
                  Month view
                </button>
                <button
                  type="button"
                  className={`secondary-button ${viewMode === "dayGridWeek" ? "secondary-button--active" : ""}`}
                  onClick={() => handleViewChange("dayGridWeek")}
                >
                  Week view
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--ink-900)]">Academic year</label>
                <AppSelect
                  value={resolvedAcademicYearId}
                  onChange={setSelectedAcademicYearId}
                  options={academicYears.map((year) => ({
                    value: year.id,
                    label: year.name,
                  }))}
                  placeholder="Select academic year"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--ink-900)]">Class</label>
                <AppSelect
                  value={selectedClassId}
                  onChange={setSelectedClassId}
                  options={[
                    { value: "ALL", label: isTeacher ? "All my classes" : "All classes" },
                    ...classes.map((schoolClass) => ({
                      value: schoolClass.id,
                      label: schoolClass.label,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--ink-900)]">Event type</label>
                <AppSelect value={selectedType} onChange={setSelectedType} options={eventTypeOptions} />
              </div>

              <div className="flex items-end">
                <button type="button" className="secondary-button w-full" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(8,39,95,0.08)] bg-white/80 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(8,39,95,0.12)] bg-white text-[var(--ink-900)] transition hover:border-[rgba(0,71,171,0.18)] hover:text-[var(--brand-blue-700)]"
                  onClick={() => handleNavigate("prev")}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(8,39,95,0.12)] bg-white text-[var(--ink-900)] transition hover:border-[rgba(0,71,171,0.18)] hover:text-[var(--brand-blue-700)]"
                  onClick={() => handleNavigate("next")}
                >
                  <ChevronRight size={18} />
                </button>
                <button type="button" className="secondary-button" onClick={() => handleNavigate("today")}>
                  Today
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(0,71,171,0.08)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue-700)]">
                  <Sparkles size={16} />
                  {visibleRange.title}
                </span>
                {selectedType !== "ALL" ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,250,205,0.72)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue-900)]">
                    {eventTypeConfig[selectedType]?.label || selectedType}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.32fr_0.68fr]">
          <motion.section
            className="surface-card rounded-[30px] p-4 md:p-6"
            {...getRevealMotion(reduceMotion, { delay: 0.1 })}
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Calendar Board</p>
                <h2 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                  Events scheduled across the selected academic window
                </h2>
              </div>
              <p className="text-sm leading-6 text-[var(--ink-700)]">
                Click any event to inspect the details behind that timeline entry.
              </p>
            </div>

            <div className="school-calendar">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height="auto"
                fixedWeekCount={false}
                dayMaxEvents={3}
                events={calendarEvents}
                datesSet={handleCalendarDatesSet}
                eventContent={CalendarEventContent}
                eventClick={(arg) => {
                  arg.jsEvent.preventDefault();
                  setSelectedEventId(arg.event.extendedProps.rawEvent.id);
                }}
                dayHeaderFormat={{ weekday: "short" }}
              />
            </div>
          </motion.section>

          <div className="space-y-6">
            <motion.section
              className="surface-card rounded-[30px] p-6"
              {...getRevealMotion(reduceMotion, { delay: 0.12 })}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Distribution</p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                    Event mix in this view
                  </h2>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(0,71,171,0.08)] text-[var(--brand-blue-700)]">
                  <Layers3 size={20} />
                </span>
              </div>

              <div className="mt-6 h-[260px]">
                {distributionData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={88}
                        paddingAngle={4}
                        animationDuration={reduceMotion ? 0 : 760}
                        animationBegin={reduceMotion ? 0 : 120}
                      >
                        {distributionData.map((entry) => (
                          <Cell key={entry.type} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CalendarChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-[rgba(8,39,95,0.12)] bg-[rgba(255,255,255,0.68)] px-6 text-center text-sm leading-7 text-[var(--ink-700)]">
                    No event distribution is available for the current filter set yet.
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3">
                {distributionData.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between rounded-[18px] border border-[rgba(8,39,95,0.08)] bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-semibold text-[var(--ink-900)]">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--ink-700)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              className="surface-card rounded-[30px] p-6"
              {...getRevealMotion(reduceMotion, { delay: 0.14 })}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Upcoming</p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-[var(--ink-900)]">
                    What is approaching next
                  </h2>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(255,250,205,0.76)] text-[var(--brand-blue-900)]">
                  <CalendarDays size={20} />
                </span>
              </div>

              <div className="calendar-list-scroll mt-6 space-y-4">
                {upcomingEvents.length ? (
                  upcomingEvents.map((event) => {
                    const typeConfig = eventTypeConfig[event.type] || eventTypeConfig.ANNOUNCEMENT;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="block w-full rounded-[22px] border border-[rgba(8,39,95,0.08)] bg-white px-5 py-4 text-left transition hover:border-[rgba(0,71,171,0.18)] hover:shadow-[0_18px_36px_rgba(8,39,95,0.08)]"
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className={`status-chip ${typeConfig.accentClassName}`}>{typeConfig.label}</span>
                            <h3 className="mt-3 font-display text-lg font-semibold text-[var(--ink-900)]">
                              {event.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{event.detail}</p>
                          </div>
                          <span className="text-sm font-semibold text-[var(--brand-blue-700)]">
                            {formatCalendarDate(event.start)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[rgba(8,39,95,0.12)] bg-[rgba(255,255,255,0.68)] px-6 py-8 text-center text-sm leading-7 text-[var(--ink-700)]">
                    No upcoming events match the current filters yet.
                  </div>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      <ModalShell
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
        title={selectedEvent?.title || "Calendar event"}
        description={selectedEvent?.detail || "More detail about the selected school calendar event."}
        size="wide"
      >
        {selectedEvent ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`status-chip ${eventTypeConfig[selectedEvent.type]?.accentClassName || "status-chip--blue"}`}
              >
                {eventTypeConfig[selectedEvent.type]?.label || selectedEvent.typeLabel || selectedEvent.type}
              </span>
              <span className="info-pill rounded-full px-4 py-2 text-sm font-semibold">
                {formatCalendarDate(selectedEvent.start)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderDetailField("Date", formatCalendarDate(selectedEvent.start))}
              {renderDetailField("Class", selectedEvent.classLabel)}
              {renderDetailField("Subject", selectedEvent.subjectName)}
              {renderDetailField("Status", selectedEvent.status)}
              {renderDetailField("Audience", selectedEvent.audienceLabel)}
              {renderDetailField("Marked entries", selectedEvent.markedCount)}
              {renderDetailField("Absent count", selectedEvent.absentCount)}
              {renderDetailField("Late count", selectedEvent.lateCount)}
              {renderDetailField("Excused count", selectedEvent.excusedCount)}
            </div>
          </div>
        ) : null}
      </ModalShell>
    </>
  );
}
