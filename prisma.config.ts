import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

/**
 * Prisma CLI (migrate, db pull, etc.) braucht auf Neon typisch eine *direct* URL
 * (ohne `-pooler` im Host). Laufzeit nutzt weiter `src/lib/db/client.ts` + `DATABASE_URL` (Pooled).
 * Ohne `DIRECT_URL` (lokale Postgres) reicht `DATABASE_URL`.
 */
const prismaCliDatasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!prismaCliDatasourceUrl) {
  throw new Error(
    "Für Prisma CLI: setze DATABASE_URL, oder mit Neon zusätzlich DIRECT_URL (direkter Host ohne -pooler).",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaCliDatasourceUrl,
  },
});
