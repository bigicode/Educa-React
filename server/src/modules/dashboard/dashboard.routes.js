import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getDashboardOverviewData } from "./dashboard.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/overview", getDashboardOverviewData);

export const dashboardRouter = router;
