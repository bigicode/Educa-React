import { z } from "zod";

function isValidDateString(value) {
  return !Number.isNaN(new Date(value).getTime());
}

export const calendarEventsQuerySchema = z.object({
  academicYearId: z.string().trim().optional(),
  schoolClassId: z.string().trim().optional(),
  dateFrom: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidDateString(value), "dateFrom must be a valid date."),
  dateTo: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidDateString(value), "dateTo must be a valid date."),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
