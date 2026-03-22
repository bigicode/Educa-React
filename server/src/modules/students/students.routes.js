import { Router } from "express";
import {
  archiveStudentRecord,
  createStudentRecord,
  getStudent,
  getStudents,
  getStudentsMeta,
  updateStudentRecord,
} from "./students.controller.js";

const router = Router();

router.get("/", getStudents);
router.get("/meta", getStudentsMeta);
router.get("/:studentId", getStudent);
router.post("/", createStudentRecord);
router.patch("/:studentId", updateStudentRecord);
router.patch("/:studentId/archive", archiveStudentRecord);

export const studentsRouter = router;
