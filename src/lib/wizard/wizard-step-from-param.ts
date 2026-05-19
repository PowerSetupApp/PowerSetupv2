/** Parst den dynamischen `wizard/[step]`-Segment-Wert (nur 1–8). */
export function wizardStepFromParam(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 8) return null;
  return n;
}
