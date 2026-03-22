import { Router } from "express";
import { healthRouter } from "../modules/health/health.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { studentsRouter } from "../modules/students/students.routes.js";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);

export const apiRouter = router;
