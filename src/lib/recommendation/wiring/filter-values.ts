/**
 * Robustes Auslesen numerischer Katalog-`filterValues` (tolerant gegen
 * "40 V", Komma-Dezimal, verschiedene Admin-Keys).
 */

function parseLooseNumber(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim().replace(/\s/g, "").replace(",", ".");
    const m = /^([\d.]+)/.exec(t);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Ersten Key aus `keys`, der eine endliche Zahl > 0 liefert (sonst `null`). */
export function readPositiveNumberFilter(
  filterValues: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): number | null {
  if (!filterValues) return null;
  for (const key of keys) {
    const v = parseLooseNumber(filterValues[key]);
    if (v != null && v > 0) return v;
  }
  return null;
}
