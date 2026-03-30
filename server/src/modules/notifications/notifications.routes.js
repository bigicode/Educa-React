import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getNotificationsOverviewData } from "./notifications.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/overview", getNotificationsOverviewData);

export const notificationsRouter = router;
