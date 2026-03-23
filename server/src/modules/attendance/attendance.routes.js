import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { getAttendanceBoardData, getAttendanceMetaData, saveAttendanceSessionData } from "./attendance.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/meta", getAttendanceMetaData);
router.get("/board", getAttendanceBoardData);
router.post("/session", saveAttendanceSessionData);

export const attendanceRouter = router;
