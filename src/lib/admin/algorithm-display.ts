/** DoD is stored as 0–1 fraction in DB; narrative UI uses 0–100 percent. */

export function dodFractionToPercent(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.round(fraction * 1000) / 10;
}

export function dodPercentToFraction(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  const clamped = Math.min(100, Math.max(0, percent));
  return Math.round((clamped / 100) * 10000) / 10000;
}
