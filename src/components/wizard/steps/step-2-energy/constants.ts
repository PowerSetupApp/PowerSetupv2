export const ROOF_AREA_NAME_OPTIONS = [
  "Hauptfläche",
  "Vordach",
  "Hinterdach",
  "Linke Seite",
  "Rechte Seite",
] as const;

export type RoofAreaPresetName = (typeof ROOF_AREA_NAME_OPTIONS)[number];

export const DEFAULT_ROOF_LENGTH_CM = 300;
export const DEFAULT_ROOF_WIDTH_CM = 200;

export const ROOF_LENGTH_MIN = 50;
export const ROOF_LENGTH_MAX = 1200;
export const ROOF_WIDTH_MIN = 50;
export const ROOF_WIDTH_MAX = 800;
export const ROOF_DIM_STEP = 10;

export function isPresetRoofName(name: string): name is RoofAreaPresetName {
  return (ROOF_AREA_NAME_OPTIONS as readonly string[]).includes(name);
}

export function clampRoofDimension(value: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(value)) return min;
  const stepped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, stepped));
}
