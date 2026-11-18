import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient() {
  // Pooled Neon connection for app traffic, through node-postgres.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // On Vercel Fluid compute, closes idle connections before an instance suspends.
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// One client per server instance. Reused across hot reloads in development.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForDb.prisma = prisma;
