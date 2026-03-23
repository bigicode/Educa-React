import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(120),
});

export function formatAuthError(error) {
  return error.issues.map((issue) => issue.message).join("; ");
}
