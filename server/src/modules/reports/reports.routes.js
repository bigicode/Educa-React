import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getReportsMetaData, getReportsOverviewData } from "./reports.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/meta", getReportsMetaData);
router.get("/overview", getReportsOverviewData);

export const reportsRouter = router;
