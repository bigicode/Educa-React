import { Router } from "express";
import {
  createStudentRecord,
  getStudent,
  getStudents,
  getStudentsMeta,
} from "./students.controller.js";

const router = Router();

router.get("/", getStudents);
router.get("/meta", getStudentsMeta);
router.get("/:studentId", getStudent);
router.post("/", createStudentRecord);

export const studentsRouter = router;
