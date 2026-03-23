import { z } from "zod";

export const announcementAudiences = ["ALL_SCHOOL", "STAFF", "TEACHERS", "STUDENTS", "PARENTS"];
export const announcementStatuses = ["DRAFT", "PUBLISHED"];

export const communicationOverviewQuerySchema = z.object({
  search: z.string().trim().optional(),
  audience: z.enum(announcementAudiences).optional(),
  status: z.enum(announcementStatuses).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(4000),
  audience: z.enum(announcementAudiences),
  status: z.enum(announcementStatuses).default("DRAFT"),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  body: z.string().trim().min(10).max(4000).optional(),
  audience: z.enum(announcementAudiences).optional(),
  status: z.enum(announcementStatuses).optional(),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
