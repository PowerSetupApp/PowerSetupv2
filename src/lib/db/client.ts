import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

// Next lädt .env* auch; mit explizitem dotenv+override gewinnt .env.local zuverlässig gegen .env (z. B. localhost).
if (typeof window === "undefined") {
  loadEnv({ path: resolve(process.cwd(), ".env") });
  loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
  databaseUrl?: string;
};

/**
 * `pg-connection-string` warnt ab neueren Versionen, wenn `sslmode` eines von
 * `prefer` / `require` / `verify-ca` ist, ohne dass das künftige Semantik-Ziel
 * explizit gesetzt wird. `uselibpqcompat=true` wählt die libpq-kompatible
 * Auslegung und entfernt die Runtime-Warnung (siehe Warnungstext von `pg`).
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
function normalizePgConnectionString(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    if (u.searchParams.has("uselibpqcompat")) return connectionString;
    const sslmode = u.searchParams.get("sslmode")?.toLowerCase();
    if (sslmode === "prefer" || sslmode === "require" || sslmode === "verify-ca") {
      u.searchParams.set("uselibpqcompat", "true");
      return u.toString();
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}

/**
 * `pg` wendet `sslmode=require` aus der URL nicht immer wie libpq an.
 * Für Prisma Postgres / andere TLS-Pflicht-Hosts explizit `ssl` setzen.
 *
 * Streng: `DATABASE_SSL_REJECT_UNAUTHORIZED=true` (Standard bei uns: false,
 * damit typische Cloud-Zertifikate unter Windows/CI zuverlässig funktionieren).
 */
function poolConfigFromConnectionString(connectionString: string): PoolConfig {
  const isNeonHost = /\.neon\.tech\b/i.test(connectionString);
  const maxFromEnv = process.env.DATABASE_POOL_MAX;
  const defaultMax = isNeonHost ? 3 : 10;
  const max =
    maxFromEnv && maxFromEnv.trim() !== "" ? Number.parseInt(maxFromEnv, 10) : defaultMax;

  const config: PoolConfig = {
    connectionString,
    max: Number.isNaN(max) ? defaultMax : max,
    connectionTimeoutMillis: 15_000,
  };

  const needsTls =
    /[?&]sslmode=(require|verify-ca|verify-full)/i.test(connectionString) ||
    /\.prisma\.io\b/i.test(connectionString);

  if (needsTls) {
    const strict = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
    config.ssl = { rejectUnauthorized: strict };
  }

  return config;
}

export function getPrisma(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const connectionString = normalizePgConnectionString(rawUrl);

  if (globalForPrisma.prisma && globalForPrisma.databaseUrl !== connectionString) {
    void globalForPrisma.pgPool?.end().catch(() => {});
    globalForPrisma.prisma = undefined;
    globalForPrisma.pgPool = undefined;
  }

  /**
   * Nach `prisma generate` (neues Modell) zeigt ein noch im globalThis gecachter
   * PrismaClient oft keine neuen Delegates — dann z. B. `prisma.algorithmTestUserPreset`
   * undefined und `.aggregate` wirft. Client verwerfen und neu aufbauen.
   */
  const prismaMaybe = globalForPrisma.prisma as { algorithmTestUserPreset?: unknown } | undefined;
  if (prismaMaybe && prismaMaybe.algorithmTestUserPreset === undefined) {
    void globalForPrisma.pgPool?.end().catch(() => {});
    globalForPrisma.prisma = undefined;
    globalForPrisma.pgPool = undefined;
  }

  if (!globalForPrisma.prisma) {
    const pool = new Pool(poolConfigFromConnectionString(connectionString));
    globalForPrisma.pgPool = pool;
    globalForPrisma.databaseUrl = connectionString;
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    const withPresets = client as { algorithmTestUserPreset?: unknown };
    if (withPresets.algorithmTestUserPreset === undefined) {
      void pool.end().catch(() => {});
      globalForPrisma.pgPool = undefined;
      throw new Error(
        "Prisma Client kennt AlgorithmTestUserPreset nicht — bitte `npx prisma generate` ausführen und den Dev-Server neu starten.",
      );
    }
    globalForPrisma.prisma = client;
  }
  return globalForPrisma.prisma;
}
