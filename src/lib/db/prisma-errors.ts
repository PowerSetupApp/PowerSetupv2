import { Prisma } from "@/generated/prisma/client";

/** Dieselbe Runtime wie `getPrisma()` — vermeidet fehlgeschlagenes `instanceof` durch doppeltes Webpack-Bundle. */
const {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} = Prisma;

/** Prisma-Codes, bei denen read-only Queries sinnvoll `database_unavailable` liefern. */
const PRISMA_INFRASTRUCTURE_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1011",
  "P1017",
  "P2021",
  "P2022",
]);

/** Sammelt Text aus Error, AggregateError (pg) und verschachtelten Ursachen. */
export function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 6) return "";
  if (error instanceof AggregateError) {
    const parts = [error.message];
    for (const e of error.errors) {
      parts.push(collectErrorText(e, depth + 1));
    }
    return parts.join(" | ");
  }
  if (error instanceof Error) {
    const parts = [error.message];
    const code = (error as Error & { code?: unknown }).code;
    if (typeof code === "string") parts.push(code);
    if (error.cause !== undefined) {
      parts.push(collectErrorText(error.cause, depth + 1));
    }
    return parts.join(" | ");
  }
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return String(error);
}

/** Nur konkrete Verbindungs-/TLS-Symptome — nicht „network“/„socket“ (treffen z. B. Prisma-Validation-Texte). */
const CONNECTIVITY_PATTERN =
  /Can't reach database server|ECONNREFUSED|connect ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|getaddrinfo EAI_|getaddrinfo|SSL[:\s]|TLS[:\s]|certificate|self signed|unable to verify|handshake failure|Connection terminated|server closed the connection|connection timed out|timeout connecting to/i;

function isPrismaQueryOrSchemaMismatch(error: unknown): boolean {
  const t = collectErrorText(error);
  return (
    error instanceof PrismaClientValidationError ||
    /Invalid `prisma\.\w+\.\w+\(\)` invocation|Unknown argument|Unknown field|Provided List<Json>|Expected .* found Json/i.test(
      t,
    )
  );
}

/** DB hinter Prisma-Schema (P2021/P2022) — auch wenn `code`/`instanceof` im Bundle fehlen. */
function isPrismaSchemaDriftMessage(error: unknown): boolean {
  const t = collectErrorText(error);
  if (/does not exist in the current database/i.test(t)) return true;
  if (/The table `[^`]+` does not exist/i.test(t)) return true;
  if (/The column `[^`]+` does not exist/i.test(t)) return true;
  return /\bP202[12]\b/.test(t);
}

/**
 * Prisma-Fehlercode auch ohne funktionierendes `instanceof PrismaClientKnownRequestError`
 * (Next/Webpack können mehrere Kopien von `@prisma/client/runtime` bundeln — `instanceof` bricht dann).
 */
function prismaKnownRequestCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth++) {
    if (current && typeof current === "object") {
      const raw = (current as { code?: unknown }).code;
      if (typeof raw === "string" && /^P\d{4}$/.test(raw)) return raw;
    }
    if (current instanceof Error && current.cause !== undefined) {
      current = current.cause;
      continue;
    }
    break;
  }
  const fromText = collectErrorText(error).match(/\b(P\d{4})\b/);
  return fromText?.[1];
}

function isPrismaInfrastructureCode(code: string | undefined): boolean {
  return code !== undefined && PRISMA_INFRASTRUCTURE_CODES.has(code);
}

/** Prisma/pg meldet oft nur den Invocation-Header ohne Detail (Next.js, Driver-Adapter). */
const BARE_PRISMA_INVOCATION = /^\s*Invalid `prisma\.\w+\.\w+\(\)` invocation:\s*$/;
const PRISMA_INVOCATION_PREFIX = /^\s*Invalid `prisma\.\w+\.\w+\(\)` invocation:/;
const PRISMA_VALIDATION_DETAIL =
  /Unknown argument|Unknown field|Provided List<Json>|Expected .* found Json|does not exist in the current database|The column `|The table `/i;

function primaryErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  return collectErrorText(error).trim();
}

/**
 * P1001/P2022 ohne Detailtext — auch wenn `error.name`/`instanceof` im Bundle nicht stimmen.
 */
function isBarePrismaInvocationMessage(error: unknown): boolean {
  const msg = primaryErrorMessage(error);
  if (BARE_PRISMA_INVOCATION.test(msg)) return true;
  if (!PRISMA_INVOCATION_PREFIX.test(msg)) return false;
  return !PRISMA_VALIDATION_DETAIL.test(msg);
}

/** True when Prisma/pg indicates the DB host is unreachable or TLS failed. */
export function isDatabaseUnreachableError(error: unknown): boolean {
  // Bekannte Codes **vor** `isPrismaQueryOrSchemaMismatch`: P2022/P2021-Meldungen enthalten oft
  // „Invalid `prisma…` invocation“ und würden sonst als Validierungs-/Queryfehler durchrutschen,
  // wenn `instanceof PrismaClientKnownRequestError` am gebündelten Typ scheitert.
  const prismaCode = prismaKnownRequestCode(error);
  if (isPrismaInfrastructureCode(prismaCode)) {
    return true;
  }
  if (isPrismaSchemaDriftMessage(error)) {
    return true;
  }
  if (error instanceof PrismaClientKnownRequestError) {
    if (isPrismaInfrastructureCode(error.code)) return true;
  }
  if (isBarePrismaInvocationMessage(error)) {
    return true;
  }
  if (isPrismaQueryOrSchemaMismatch(error)) {
    // „Invalid `prisma…` invocation“ mit Validierungs-/Schema-Detail ⇒ echter Query-Fehler
    return false;
  }
  if (error instanceof PrismaClientInitializationError) {
    const t = error.message;
    return (
      CONNECTIVITY_PATTERN.test(t) ||
      /Can't reach database server|database server|ECONNREFUSED|TLS|SSL|certificate|timeout/i.test(t)
    );
  }
  return CONNECTIVITY_PATTERN.test(collectErrorText(error));
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Keine Verbindung zur Datenbank. Prüfe `DATABASE_URL` in `.env.local` und die Netzwerkverbindung.";

export type DbReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "database_unavailable"; message: string };

function databaseUrlHostHint(): string {
  if (process.env.NODE_ENV === "production") return "";
  const raw = process.env.DATABASE_URL;
  if (!raw) return "";
  try {
    const host = new URL(raw.replace(/^postgresql:/i, "postgres:")).hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      return `\n\nHinweis: DATABASE_URL zeigt auf „${host}“. Für Prisma Postgres die Cloud-URL in \`.env.local\` eintragen (\`override\` gewinnt gegen \`.env\`) und den Dev-Server neu starten.`;
    }
  } catch {
    /* ignore */
  }
  return "";
}

function databaseUnavailableMessage(error: unknown): string {
  if (error instanceof Error && error.message === "DATABASE_URL is not set") {
    return "DATABASE_URL ist nicht gesetzt. Lege die Variable in `.env.local` an (siehe `.env.example`) und starte den Dev-Server neu.";
  }
  const driftCode = prismaKnownRequestCode(error);
  const driftViaInstance =
    error instanceof PrismaClientKnownRequestError &&
    (error.code === "P2022" || error.code === "P2021");
  if (
    driftCode === "P2022" ||
    driftCode === "P2021" ||
    driftViaInstance ||
    isPrismaSchemaDriftMessage(error)
  ) {
    return (
      "Die Datenbank passt nicht zum aktuellen Prisma-Schema (fehlende Spalte oder Tabelle). " +
      "Lokal: `npx prisma migrate dev` — Deployment: `npx prisma migrate deploy`.\n\n" +
      collectErrorText(error).slice(0, 500)
    );
  }
  const base = DATABASE_UNAVAILABLE_MESSAGE + databaseUrlHostHint();
  if (process.env.NODE_ENV === "development") {
    const detail = collectErrorText(error).trim();
    if (detail) {
      return `${base}\n\nTechnisch: ${detail.slice(0, 600)}`;
    }
  }
  return base;
}

/**
 * Read-only helper: wirft bei echten Anwendungs-/Validierungsfehlern weiter.
 * Verbindungsprobleme, fehlende Migration (P2022/P2021) und fehlende `DATABASE_URL` liefern `ok: false`.
 */
export async function readFromDatabase<T>(fn: () => Promise<T>): Promise<DbReadResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof Error && error.message === "DATABASE_URL is not set") {
      return {
        ok: false,
        reason: "database_unavailable",
        message: databaseUnavailableMessage(error),
      };
    }
    if (
      isDatabaseUnreachableError(error) ||
      isBarePrismaInvocationMessage(error)
    ) {
      return {
        ok: false,
        reason: "database_unavailable",
        message: databaseUnavailableMessage(error),
      };
    }
    throw error;
  }
}
