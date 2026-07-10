import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import pkg from '@prisma/client';
import { env } from "./env.js";
const { PrismaClient } = pkg;


const adapter = new PrismaMariaDb({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  connectionLimit: 5,
});

export const prisma = new PrismaClient({ adapter });
