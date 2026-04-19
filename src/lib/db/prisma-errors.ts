import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";

/** Sammelt Text aus Error, AggregateError (pg) und verschachtelten Ursachen. */
export function collectErrorText(error: unknown): string {
  if (error instanceof AggregateError) {
    const parts = [error.message];
    for (const e of error.errors) {
      parts.push(e instanceof Error ? e.message : String(e));
    }
    return parts.join(" | ");
  }
  if (error instanceof Error) {
    const withCause =
      error.cause instanceof Error ? `${error.message} | ${error.cause.message}` : error.message;
    return withCause;
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

/** True when Prisma/pg indicates the DB host is unreachable or TLS failed. */
export function isDatabaseUnreachableError(error: unknown): boolean {
  // Bekannte Codes zuerst: P2022-Meldungen enthalten oft „Invalid `prisma…` invocation“ und
  // würden sonst fälschlich als reine Query-/Schemafehler klassifiziert (readFromDatabase wirft).
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1017") return true;
    // Migration fehlt / DB hinter dem Client (Spalte oder Tabelle existiert nicht)
    if (error.code === "P2022" || error.code === "P2021") return true;
  }
  if (isPrismaQueryOrSchemaMismatch(error)) {
    return false;
  }
  if (error instanceof PrismaClientKnownRequestError) {
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
  if (error instanceof PrismaClientKnownRequestError && (error.code === "P2022" || error.code === "P2021")) {
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
    if (isDatabaseUnreachableError(error)) {
      return {
        ok: false,
        reason: "database_unavailable",
        message: databaseUnavailableMessage(error),
      };
    }
    throw error;
  }
}
