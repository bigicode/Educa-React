import { z } from "zod";

export const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export const attendanceBoardQuerySchema = z.object({
  schoolClassId: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  termId: z.string().trim().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format."),
});

export const saveAttendanceSessionSchema = z.object({
  schoolClassId: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  termId: z.string().trim().nullable().optional(),
  date: z.string().datetime(),
  entries: z
    .array(
      z.object({
        studentId: z.string().trim().min(1),
        status: z.enum(attendanceStatuses).nullable().optional(),
        remarks: z.string().trim().max(240).nullable().optional(),
      }),
    )
    .min(1),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
