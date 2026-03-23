import { z } from "zod";

export const assessmentTypes = ["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT"];
export const assessmentStatuses = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED", "PUBLISHED"];

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(30),
  description: z.string().trim().max(240).nullable().optional(),
});

export const createClassMappingSchema = z.object({
  schoolClassId: z.string().trim().min(1),
  subjectId: z.string().trim().min(1),
});

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(120),
  type: z.enum(assessmentTypes),
  status: z.enum(assessmentStatuses).optional().default("SCHEDULED"),
  subjectId: z.string().trim().min(1),
  schoolClassId: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  termId: z.string().trim().nullable().optional(),
  assignedById: z.string().trim().nullable().optional(),
  totalMarks: z.number().int().min(1).max(1000).optional().default(100),
  dueDate: z.string().datetime().nullable().optional(),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
