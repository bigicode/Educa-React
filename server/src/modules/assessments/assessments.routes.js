import { Router } from "express";
import {
  createAssessmentRecord,
  getAssessment,
  getAssessments,
  getAssessmentsMeta,
  updateAssessmentStatusRecord,
  upsertAssessmentGradesRecord,
} from "./assessments.controller.js";

const router = Router();

router.get("/", getAssessments);
router.get("/meta", getAssessmentsMeta);
router.get("/:assessmentId", getAssessment);
router.post("/", createAssessmentRecord);
router.patch("/:assessmentId/status", updateAssessmentStatusRecord);
router.post("/:assessmentId/grades", upsertAssessmentGradesRecord);

export const assessmentsRouter = router;
