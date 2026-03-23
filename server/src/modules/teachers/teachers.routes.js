import { Router } from "express";
import {
  archiveTeacherRecord,
  createTeacherRecord,
  getTeacher,
  getTeachers,
  getTeachersMeta,
  updateTeacherRecord,
} from "./teachers.controller.js";

const router = Router();

router.get("/", getTeachers);
router.get("/meta", getTeachersMeta);
router.get("/:teacherId", getTeacher);
router.post("/", createTeacherRecord);
router.patch("/:teacherId", updateTeacherRecord);
router.patch("/:teacherId/archive", archiveTeacherRecord);

export const teachersRouter = router;
