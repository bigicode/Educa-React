import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import {
  createAnnouncementRecord,
  getCommunicationOverviewData,
  updateAnnouncementRecord,
} from "./communication.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/overview", getCommunicationOverviewData);
router.post("/announcements", createAnnouncementRecord);
router.patch("/announcements/:announcementId", updateAnnouncementRecord);

export const communicationRouter = router;
