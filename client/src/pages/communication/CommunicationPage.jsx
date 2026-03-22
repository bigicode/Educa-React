import { ModuleWorkspacePage } from "../../components/ui/ModuleWorkspacePage";

const stats = [
  { label: "Unread Threads", value: "18", detail: "Internal and parent-facing combined" },
  { label: "Queued Notices", value: "6", detail: "Need admin approval" },
  { label: "Delivery Success", value: "98%", detail: "Latest broadcast performance" },
];

const focusItems = [
  {
    title: "Announcements",
    description: "School-wide notices and targeted broadcasts should live in this module.",
    status: "Phase 2",
  },
  {
    title: "Internal messaging",
    description: "Teacher, admin, and registrar communication will move here from demo state.",
    status: "Phase 2",
  },
  {
    title: "Parent communication",
    description: "Attendance alerts and grade notices will depend on this later.",
    status: "Phase 3",
  },
];

const checklistItems = [
  {
    title: "Announcement records",
    description: "Store title, content, audience, delivery status, and created-by metadata.",
  },
  {
    title: "Message threads",
    description: "Group conversations by sender, recipient, and unread state.",
  },
  {
    title: "Notification bridge",
    description: "Use the same events to feed header messages, alerts, and future mobile notifications.",
  },
];

export function CommunicationPage() {
  return (
    <ModuleWorkspacePage
      eyebrow="Communication"
      title="Broadcasts, staff messaging, and school communication now have a clear delivery track."
      description="Communication will evolve from the header demo tray into a proper module for announcements, internal threads, and later parent notices."
      primaryActionLabel="Create notice"
      secondaryActionLabel="Open threads"
      stats={stats}
      focusTitle="Messaging rollout"
      focusItems={focusItems}
      checklistTitle="Communication module foundation"
      checklistItems={checklistItems}
    />
  );
}
