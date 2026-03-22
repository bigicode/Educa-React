import { z } from "zod";

export const enrollmentStatuses = ["ACTIVE", "TRANSFERRED", "GRADUATED", "ARCHIVED"];

export const listStudentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(enrollmentStatuses).optional(),
  schoolClassId: z.string().trim().optional(),
  academicYearId: z.string().trim().optional(),
});

export const createStudentSchema = z
  .object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    password: z.string().min(8).max(120),
    admissionNumber: z.string().trim().min(3).max(40),
    dateOfBirth: z.string().datetime().optional(),
    guardianName: z.string().trim().max(120).optional(),
    guardianPhone: z.string().trim().max(30).optional(),
    schoolClassId: z.string().trim().optional(),
    academicYearId: z.string().trim().optional(),
    enrollmentStatus: z.enum(enrollmentStatuses).optional().default("ACTIVE"),
  })
  .superRefine((value, ctx) => {
    const hasClass = Boolean(value.schoolClassId);
    const hasYear = Boolean(value.academicYearId);

    if (hasClass !== hasYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide both schoolClassId and academicYearId when creating an enrollment.",
        path: hasClass ? ["academicYearId"] : ["schoolClassId"],
      });
    }
  });

export const updateStudentSchema = z
  .object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email(),
    admissionNumber: z.string().trim().min(3).max(40),
    dateOfBirth: z.string().datetime().nullable().optional(),
    guardianName: z.string().trim().max(120).nullable().optional(),
    guardianPhone: z.string().trim().max(30).nullable().optional(),
    schoolClassId: z.string().trim().optional(),
    academicYearId: z.string().trim().optional(),
    enrollmentStatus: z.enum(enrollmentStatuses).optional(),
  })
  .superRefine((value, ctx) => {
    const hasClass = Boolean(value.schoolClassId);
    const hasYear = Boolean(value.academicYearId);

    if (hasClass !== hasYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide both schoolClassId and academicYearId when updating an enrollment.",
        path: hasClass ? ["academicYearId"] : ["schoolClassId"],
      });
    }
  });

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
