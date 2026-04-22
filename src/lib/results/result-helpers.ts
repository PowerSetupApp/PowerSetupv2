/** 30 Tage — Retention für Result-UUIDs (Produktregel). */
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function addResultRetention(from: Date = new Date()): Date {
  return new Date(from.getTime() + RETENTION_MS);
}

export function isResultExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

/** True, wenn Berechnung + Empfehlungen bereits persistiert sind (Idempotenz für POST generate). */
export function hasPersistedGeneration(r: {
  calculations: unknown;
  recommendations: unknown;
}): boolean {
  if (r.calculations == null || typeof r.calculations !== "object") return false;
  const calc = r.calculations as Record<string, unknown>;
  if (!("battery" in calc) || !("solar" in calc)) return false;
  if (r.recommendations == null || typeof r.recommendations !== "object") return false;
  const rec = r.recommendations as Record<string, unknown>;
  return "prefilter" in rec;
}
