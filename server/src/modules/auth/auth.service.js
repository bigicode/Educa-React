import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

function formatRole(role) {
  return role
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

function buildInitials(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "US";
}

async function getActiveAcademicYearName() {
  const academicYear =
    (await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { name: true },
    })) ||
    (await prisma.academicYear.findFirst({
      orderBy: [{ startDate: "desc" }],
      select: { name: true },
    }));

  return academicYear?.name || "Not configured";
}

function serializeUser(user, academicYear) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    initials: buildInitials(user.firstName, user.lastName),
    email: user.email,
    role: formatRole(user.role),
    roleKey: user.role,
    isActive: user.isActive,
    academicYear,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );
}

export async function loginUser(credentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(credentials.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account is inactive. Contact your administrator.", 403);
  }

  const academicYear = await getActiveAcademicYearName();

  return {
    accessToken: signAccessToken(user),
    user: serializeUser(user, academicYear),
  };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("Authentication required.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account is inactive. Contact your administrator.", 403);
  }

  const academicYear = await getActiveAcademicYearName();
  return serializeUser(user, academicYear);
}
