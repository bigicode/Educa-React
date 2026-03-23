import { Router } from "express";
import {
  createAcademicAssessmentRecord,
  createAcademicClassMappingRecord,
  createAcademicSubjectRecord,
  getAcademicsMetaData,
  getAcademicsOverviewData,
} from "./academics.controller.js";

const router = Router();

router.get("/overview", getAcademicsOverviewData);
router.get("/meta", getAcademicsMetaData);
router.post("/subjects", createAcademicSubjectRecord);
router.post("/class-mappings", createAcademicClassMappingRecord);
router.post("/assessments", createAcademicAssessmentRecord);

export const academicsRouter = router;
