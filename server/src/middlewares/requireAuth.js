import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function requireAuth(req, _res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    return next(new AppError("Invalid or expired authentication token.", 401));
  }
}
