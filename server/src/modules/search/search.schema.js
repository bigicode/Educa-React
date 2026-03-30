import { z } from "zod";

export const globalSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query is required.")
    .max(80, "Search query is too long."),
});

export function formatZodError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
