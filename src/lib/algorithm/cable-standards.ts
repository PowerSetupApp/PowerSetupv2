/**
 * Standard metric copper cross-sections (EU trade sizes). Used for rounding
 * cable recommendations. Same grid as the product prefilter.
 */

/** Handelsübliche Kupfer-Querschnitte [mm²] — aufrunden für Kabelwahl. */
export const STANDARD_MM2 = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240,
] as const;

/**
 * Rounds a raw required cross-section to the next standard size (never down).
 * Non-finite or non-positive input yields 0.
 */
export function roundUpToStandardMm2(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  for (const s of STANDARD_MM2) {
    if (s >= raw - 1e-6) return s;
  }
  return STANDARD_MM2[STANDARD_MM2.length - 1]!;
}
