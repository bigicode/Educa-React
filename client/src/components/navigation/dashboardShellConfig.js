import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  FilePenLine,
  LayoutDashboard,
  MessageSquareMore,
  Users,
} from "lucide-react";

export const navigationSections = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Academic Core",
    items: [
      { name: "Students", to: "/dashboard/students", icon: Users },
      { name: "Teachers", to: "/dashboard/teachers", icon: Briefcase },
      { name: "Academics", to: "/dashboard/academics", icon: BookOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Attendance", to: "/dashboard/attendance", icon: ClipboardCheck },
      { name: "Assessments", to: "/dashboard/assessments", icon: FilePenLine },
      { name: "Calendar", to: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Communication", to: "/dashboard/communication", icon: MessageSquareMore },
      { name: "Reports", to: "/dashboard/reports", icon: BarChart3 },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

export const layoutStorageKey = "educa:sidebar-collapsed";

const pageMeta = {
  "/dashboard": {
    label: "Administration",
    title: "School Overview",
    searchPlaceholder: "Search students, approvals, support cases, finance...",
  },
  "/dashboard/students": {
    label: "Students",
    title: "Student Management",
    searchPlaceholder: "Search students, guardians, classes, admission queue...",
  },
  "/dashboard/teachers": {
    label: "Teachers",
    title: "Teacher Management",
    searchPlaceholder: "Search teachers, assignments, departments, workloads...",
  },
  "/dashboard/academics": {
    label: "Academics",
    title: "Academic Operations",
    searchPlaceholder: "Search subjects, assessments, departments, teachers...",
  },
  "/dashboard/attendance": {
    label: "Attendance",
    title: "Attendance Operations",
    searchPlaceholder: "Search registers, students, late arrivals, attendance flags...",
  },
  "/dashboard/assessments": {
    label: "Assessments",
    title: "Assessment and Gradebook",
    searchPlaceholder: "Search assessments, grading queues, subjects, results...",
  },
  "/dashboard/calendar": {
    label: "Calendar",
    title: "Calendar and Scheduling",
    searchPlaceholder: "Search events, deadlines, exam blocks, meetings...",
  },
  "/dashboard/communication": {
    label: "Communication",
    title: "School Communication",
    searchPlaceholder: "Search notices, threads, parent alerts, announcements...",
  },
  "/dashboard/reports": {
    label: "Reports",
    title: "Reporting and Analytics",
    searchPlaceholder: "Search reports, exports, trends, dashboards...",
  },
};

export function getPageMeta(pathname) {
  return pageMeta[pathname] || pageMeta["/dashboard"];
}
