import { z } from "zod";

export const teacherStatuses = ["ACTIVE", "INACTIVE"];

export const listTeachersQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(teacherStatuses).optional(),
  subjectId: z.string().trim().optional(),
  schoolClassId: z.string().trim().optional(),
});

const createOrUpdateTeacherBaseSchema = z
  .object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    employeeCode: z.string().trim().min(3).max(40),
    phoneNumber: z.string().trim().max(30).nullable().optional(),
    qualification: z.string().trim().max(120).nullable().optional(),
    homeroomClassId: z.string().trim().nullable().optional(),
    subjectId: z.string().trim().nullable().optional(),
    assignmentClassId: z.string().trim().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.assignmentClassId && !value.subjectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a subject before assigning a class allocation.",
        path: ["assignmentClassId"],
      });
    }
  });

export const createTeacherSchema = createOrUpdateTeacherBaseSchema.extend({
  password: z.string().min(8).max(120),
});

export const updateTeacherSchema = createOrUpdateTeacherBaseSchema.extend({
  accountStatus: z.enum(teacherStatuses).optional(),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
