import { z } from "zod";
import { createAssessmentSchema } from "../academics/academics.schema.js";

export { createAssessmentSchema };

export const assessmentStatuses = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "PUBLISHED"];
export const assessmentTypes = ["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT"];

export const listAssessmentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(assessmentStatuses).optional(),
  type: z.enum(assessmentTypes).optional(),
  subjectId: z.string().trim().optional(),
  schoolClassId: z.string().trim().optional(),
});

export const updateAssessmentStatusSchema = z.object({
  status: z.enum(assessmentStatuses),
});

export const upsertAssessmentGradesSchema = z.object({
  gradeEntries: z
    .array(
      z.object({
        studentId: z.string().trim().min(1),
        marks: z.number().min(0).max(1000).nullable().optional(),
        remarks: z.string().trim().max(300).nullable().optional(),
      }),
    )
    .min(1),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
