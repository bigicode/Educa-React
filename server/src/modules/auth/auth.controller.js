import { formatAuthError, loginSchema } from "./auth.schema.js";
import { getCurrentUser, loginUser } from "./auth.service.js";

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: formatAuthError(parsed.error),
      });
    }

    const session = await loginUser(parsed.data);

    return res.json({
      message: "Login successful.",
      data: session,
    });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.auth.userId);

    return res.json({
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}
