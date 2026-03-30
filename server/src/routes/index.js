import { Router } from "express";
import { healthRouter } from "../modules/health/health.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { studentsRouter } from "../modules/students/students.routes.js";
import { teachersRouter } from "../modules/teachers/teachers.routes.js";
import { academicsRouter } from "../modules/academics/academics.routes.js";
import { assessmentsRouter } from "../modules/assessments/assessments.routes.js";
import { attendanceRouter } from "../modules/attendance/attendance.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { communicationRouter } from "../modules/communication/communication.routes.js";
import { notificationsRouter } from "../modules/notifications/notifications.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { calendarRouter } from "../modules/calendar/calendar.routes.js";
import { searchRouter } from "../modules/search/search.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);
router.use("/teachers", teachersRouter);
router.use("/academics", academicsRouter);
router.use("/assessments", assessmentsRouter);
router.use("/attendance", attendanceRouter);
router.use("/dashboard", dashboardRouter);
router.use("/communication", communicationRouter);
router.use("/notifications", notificationsRouter);
router.use("/reports", reportsRouter);
router.use("/calendar", calendarRouter);
router.use("/search", searchRouter);

export const apiRouter = router;
