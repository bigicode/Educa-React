export const dashboardAlerts = [
  {
    title: "Grade 10B attendance dropped to 86%",
    detail: "Review with class teacher by noon",
    tone: "rose",
  },
  {
    title: "Three new admissions waiting document verification",
    detail: "Registrar desk queue",
    tone: "cream",
  },
  {
    title: "Transport route East-3 delayed by 18 minutes",
    detail: "Driver reported traffic congestion",
    tone: "blue",
  },
];

export const dashboardApprovals = [
  { item: "Admission - Neema Mollel", owner: "Registrar", due: "Today", status: "Waiting docs" },
  { item: "Transfer request - John Kweka", owner: "School Admin", due: "Today", status: "Review" },
  { item: "Leave request - Teacher Ruth", owner: "HR Desk", due: "Tomorrow", status: "Pending" },
  { item: "Fee waiver - Grade 7 scholarship", owner: "Finance", due: "Tomorrow", status: "Priority" },
];

export const dashboardCommunications = [
  {
    title: "Parent reminder",
    body: "Reminder queued for 38 families with overdue fee balances.",
    time: "5 min ago",
  },
  {
    title: "Academic notice",
    body: "Exam moderation note sent to Science and Mathematics teams.",
    time: "22 min ago",
  },
  {
    title: "Attendance escalation",
    body: "Automated summary prepared for class teachers below 90% attendance.",
    time: "1 hr ago",
  },
];

export const dashboardSupportQueue = [
  { student: "Amina Yusuf", issue: "Medical excuse pending", owner: "Nurse Desk" },
  { student: "Daniel Peter", issue: "Low attendance follow-up", owner: "Class Teacher" },
  { student: "Rehema Ally", issue: "Fee plan confirmation", owner: "Finance Office" },
];

export const studentsList = [
  {
    name: "Amina Yusuf",
    className: "Grade 8 - A",
    attendance: "97%",
    guardian: "Yusuf Salum",
    phone: "+255 713 221 991",
    balance: "TZS 0",
    status: "Excellent",
  },
  {
    name: "Brian Mushi",
    className: "Grade 10 - B",
    attendance: "92%",
    guardian: "Anna Mushi",
    phone: "+255 752 339 182",
    balance: "TZS 210,000",
    status: "Good",
  },
  {
    name: "Clara Joseph",
    className: "Grade 7 - C",
    attendance: "95%",
    guardian: "Joseph Mtema",
    phone: "+255 742 110 472",
    balance: "TZS 0",
    status: "Excellent",
  },
  {
    name: "Daniel Peter",
    className: "Grade 11 - A",
    attendance: "88%",
    guardian: "Peter Michael",
    phone: "+255 678 904 115",
    balance: "TZS 345,000",
    status: "Watch",
  },
  {
    name: "Ester Mrema",
    className: "Grade 9 - B",
    attendance: "90%",
    guardian: "Mrema Elias",
    phone: "+255 765 121 881",
    balance: "TZS 120,000",
    status: "Follow-up",
  },
];

export const admissionsQueue = [
  { name: "Neema Mollel", step: "Birth certificate verification", owner: "Registrar" },
  { name: "Juma Kileo", step: "Guardian interview scheduling", owner: "Admissions" },
  { name: "Sofia Said", step: "Fee plan confirmation", owner: "Finance" },
];

export const academicsSubjectProgress = [
  { subject: "Mathematics", progress: 82, teacher: "Mr. Msuya" },
  { subject: "Sciences", progress: 78, teacher: "Ms. Rehema" },
  { subject: "Languages", progress: 88, teacher: "Mr. Mponzi" },
  { subject: "ICT", progress: 91, teacher: "Ms. Bahati" },
];

export const academicsAssessmentPipeline = [
  {
    title: "Grade 10 Mathematics CAT",
    owner: "Academic Office",
    due: "Tue 23 Mar",
    status: "Draft ready",
  },
  {
    title: "Grade 8 Science Practical",
    owner: "Science Dept",
    due: "Wed 24 Mar",
    status: "Resource check",
  },
  {
    title: "Grade 11 Essay Moderation",
    owner: "Languages Dept",
    due: "Thu 25 Mar",
    status: "Moderation",
  },
  {
    title: "Grade 7 Continuous Assessment",
    owner: "Class Teachers",
    due: "Fri 26 Mar",
    status: "Scheduling",
  },
];

export const headerMessages = [
  {
    id: "msg-1",
    sender: "Finance Office",
    subject: "Fee reminder batch ready",
    preview: "38 parent reminders are prepared and waiting for final confirmation.",
    time: "8 min ago",
    unread: true,
  },
  {
    id: "msg-2",
    sender: "Registrar",
    subject: "Admissions documents updated",
    preview: "Three student files now have the required uploads attached.",
    time: "25 min ago",
    unread: true,
  },
  {
    id: "msg-3",
    sender: "Academic Office",
    subject: "Moderation note circulated",
    preview: "Department heads received the midterm moderation schedule.",
    time: "1 hr ago",
    unread: false,
  },
];

export const userProfile = {
  initials: "AM",
  name: "Amina Mollel",
  role: "Super Admin",
  email: "amina@educa.school",
  campus: "Main Campus",
  academicYear: "2026/2027",
};

export const globalSearchEntities = [
  ...studentsList.map((student) => ({
    id: `student-${student.name}`,
    title: student.name,
    subtitle: `${student.className} • Guardian ${student.guardian}`,
    category: "Student",
    route: "/dashboard/students",
    keywords: [student.name, student.className, student.guardian, student.status],
  })),
  ...dashboardApprovals.map((approval) => ({
    id: `approval-${approval.item}`,
    title: approval.item,
    subtitle: `${approval.owner} • Due ${approval.due}`,
    category: "Approval",
    route: "/dashboard",
    keywords: [approval.item, approval.owner, approval.status, approval.due],
  })),
  ...academicsAssessmentPipeline.map((assessment) => ({
    id: `assessment-${assessment.title}`,
    title: assessment.title,
    subtitle: `${assessment.owner} • ${assessment.due}`,
    category: "Assessment",
    route: "/dashboard/academics",
    keywords: [assessment.title, assessment.owner, assessment.status, assessment.due],
  })),
  ...academicsSubjectProgress.map((subject) => ({
    id: `subject-${subject.subject}`,
    title: subject.subject,
    subtitle: `${subject.teacher} • ${subject.progress}% progress`,
    category: "Subject",
    route: "/dashboard/academics",
    keywords: [subject.subject, subject.teacher],
  })),
  ...dashboardSupportQueue.map((item) => ({
    id: `support-${item.student}`,
    title: item.student,
    subtitle: `${item.issue} • ${item.owner}`,
    category: "Support Case",
    route: "/dashboard",
    keywords: [item.student, item.issue, item.owner],
  })),
  {
    id: "module-teachers",
    title: "Teacher management",
    subtitle: "Profiles, allocations, and workload coverage",
    category: "Module",
    route: "/dashboard/teachers",
    keywords: ["teachers", "staff", "faculty", "allocations", "workload"],
  },
  {
    id: "module-attendance",
    title: "Attendance operations",
    subtitle: "Class registers, absences, and late tracking",
    category: "Module",
    route: "/dashboard/attendance",
    keywords: ["attendance", "register", "absent", "late", "watchlist"],
  },
  {
    id: "module-assessments",
    title: "Assessment and gradebook",
    subtitle: "Assignments, exams, and grading queues",
    category: "Module",
    route: "/dashboard/assessments",
    keywords: ["assessments", "gradebook", "exams", "grading", "results"],
  },
  {
    id: "module-calendar",
    title: "Calendar and scheduling",
    subtitle: "Events, deadlines, and exam blocks",
    category: "Module",
    route: "/dashboard/calendar",
    keywords: ["calendar", "events", "timetable", "schedule", "deadlines"],
  },
  {
    id: "module-communication",
    title: "School communication",
    subtitle: "Notices, threads, and parent alerts",
    category: "Module",
    route: "/dashboard/communication",
    keywords: ["communication", "announcements", "messages", "alerts", "notices"],
  },
  {
    id: "module-reports",
    title: "Reports and analytics",
    subtitle: "Exports, dashboards, and operational metrics",
    category: "Module",
    route: "/dashboard/reports",
    keywords: ["reports", "analytics", "exports", "metrics", "dashboard"],
  },
];
