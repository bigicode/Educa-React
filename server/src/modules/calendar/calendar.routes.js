import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getCalendarEventsData, getCalendarMetaData } from "./calendar.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/meta", getCalendarMetaData);
router.get("/events", getCalendarEventsData);

export const calendarRouter = router;
