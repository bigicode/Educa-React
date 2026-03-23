import { Router } from "express";
import { healthRouter } from "../modules/health/health.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { studentsRouter } from "../modules/students/students.routes.js";
import { teachersRouter } from "../modules/teachers/teachers.routes.js";
import { academicsRouter } from "../modules/academics/academics.routes.js";
import { assessmentsRouter } from "../modules/assessments/assessments.routes.js";
import { attendanceRouter } from "../modules/attendance/attendance.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);
router.use("/teachers", teachersRouter);
router.use("/academics", academicsRouter);
router.use("/assessments", assessmentsRouter);
router.use("/attendance", attendanceRouter);
router.use("/dashboard", dashboardRouter);

export const apiRouter = router;
