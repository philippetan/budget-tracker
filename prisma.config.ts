import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local the same way Next.js does (Prisma doesn't load env files).
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI (migrate, studio, db pull) uses the direct connection.
    // The app itself connects through the pooled DATABASE_URL in lib/db.ts.
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});
