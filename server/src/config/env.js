import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 5000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret",
  DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
  DATABASE_PORT: Number(process.env.DATABASE_PORT || 3306),
  DATABASE_USER: process.env.DATABASE_USER || "root",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "educa_school",
};

