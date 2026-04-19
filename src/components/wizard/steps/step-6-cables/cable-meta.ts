import type { CableLengths } from "@/lib/algorithm/types";

/**
 * Per-route step/min: short, high-current DC runs use 0.1 m; longer or more variable routing uses 0.25 m.
 * (Charger / Booster output / WR / fuse box are typically very short runs.)
 */
export const CABLE_FIELD_META: Record<
  keyof CableLengths,
  { label: string; maxM: number; minM: number; stepM: number }
> = {
  starterToService: {
    label: "Starterbatterie → Ladebooster",
    maxM: 30,
    minM: 0.25,
    stepM: 0.25,
  },
  boosterToService: {
    label: "Ladebooster → Versorgerbatterie",
    maxM: 15,
    minM: 0.1,
    stepM: 0.1,
  },
  solarToRegulator: {
    label: "Solarmodule → Laderegler",
    maxM: 30,
    minM: 0.25,
    stepM: 0.25,
  },
  regulatorToService: {
    label: "Laderegler → Versorgerbatterie",
    maxM: 15,
    minM: 0.1,
    stepM: 0.1,
  },
  chargerToService: {
    label: "Batterieladegerät → Versorgerbatterie",
    maxM: 15,
    minM: 0.1,
    stepM: 0.1,
  },
  serviceToInverter: {
    label: "Versorgerbatterie → Wechselrichter",
    maxM: 15,
    minM: 0.1,
    stepM: 0.1,
  },
  batteryToFuseBox: {
    label: "Batterie → Sicherungskasten",
    maxM: 15,
    minM: 0.1,
    stepM: 0.1,
  },
};

export function formatCableLengthMeters(value: number, stepM: number): string {
  const decimals = stepM >= 0.25 ? 2 : 1;
  const rounded = Number(value.toFixed(decimals));
  return String(rounded);
}

/** Snap to the route’s min/step grid (handles persisted values that are off-grid). */
export function snapCableLength(value: number, minM: number, maxM: number, stepM: number): number {
  if (!(stepM > 0) || maxM < minM) return value;
  const k = Math.round((value - minM) / stepM);
  let v = minM + k * stepM;
  v = Math.min(maxM, Math.max(minM, v));
  const decimals = stepM >= 0.25 ? 2 : 1;
  return Number(v.toFixed(decimals));
}
