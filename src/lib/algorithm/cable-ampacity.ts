/**
 * Minimum standard cross-section [mm²] from current-carrying capacity, so that
 * short cable runs (tiny ΔU) are still not undersized thermally.
 *
 * Source: `.agents/skills/mobile-home-electrics-basics/references/cables.md`
 * (PVC single-core, ~30 °C, indicative — meet both ΔU and ampacity).
 */

import { STANDARD_MM2, roundUpToStandardMm2 } from "./cable-standards";

export type CableAmpacityInstallMode = "free_air" | "bundled";

/** Fused rows: (mm², I_free, I_bundled) from cables.md, plus 1.5/120+ extensions. */
const _AMPACITY_ROWS: readonly {
  readonly mm2: (typeof STANDARD_MM2)[number];
  readonly freeAirA: number;
  readonly bundledA: number;
}[] = [
  { mm2: 1.5, freeAirA: 20, bundledA: 15 },
  { mm2: 2.5, freeAirA: 32, bundledA: 24 },
  { mm2: 4, freeAirA: 42, bundledA: 32 },
  { mm2: 6, freeAirA: 54, bundledA: 41 },
  { mm2: 10, freeAirA: 73, bundledA: 57 },
  { mm2: 16, freeAirA: 98, bundledA: 76 },
  { mm2: 25, freeAirA: 129, bundledA: 101 },
  { mm2: 35, freeAirA: 158, bundledA: 125 },
  { mm2: 50, freeAirA: 198, bundledA: 151 },
  { mm2: 70, freeAirA: 245, bundledA: 192 },
  { mm2: 95, freeAirA: 292, bundledA: 232 },
  // Indicative large sizes (same file note: use datasheet for final value).
  { mm2: 120, freeAirA: 344, bundledA: 272 },
  { mm2: 150, freeAirA: 400, bundledA: 320 },
  { mm2: 185, freeAirA: 460, bundledA: 370 },
  { mm2: 240, freeAirA: 550, bundledA: 450 },
] as const;

const LAST = _AMPACITY_ROWS[_AMPACITY_ROWS.length - 1]!;

/** (ambient °C, derating factor) — from `cables.md`, table basis 30 °C. */
const AMBIENT_TEMP_DERATING: readonly [number, number][] = [
  [30, 1.0],
  [40, 0.87],
  [50, 0.71],
];

/**
 * Multiplicative ampacity factor for ambient temperature.
 * ≤30 °C → 1.0 (no uplift above table); linear between 30–50 °C; ≥50 °C → 0.71.
 */
export function ambientTempDerateFactor(ambientC: number): number {
  if (!Number.isFinite(ambientC)) return 1;
  if (ambientC <= AMBIENT_TEMP_DERATING[0]![0]) return AMBIENT_TEMP_DERATING[0]![1];
  for (let i = 0; i < AMBIENT_TEMP_DERATING.length - 1; i++) {
    const [t0, f0] = AMBIENT_TEMP_DERATING[i]!;
    const [t1, f1] = AMBIENT_TEMP_DERATING[i + 1]!;
    if (ambientC <= t1) {
      const t = (ambientC - t0) / (t1 - t0);
      return f0 + t * (f1 - f0);
    }
  }
  return AMBIENT_TEMP_DERATING[AMBIENT_TEMP_DERATING.length - 1]![1];
}

/**
 * Smallest **standard** mm² in {@link STANDARD_MM2} that can carry `designA`
 * [A] continuously for the given installation derating. If `designA` exceeds
 * the table, the largest row is used (extremely rare in camper use).
 *
 * @param derateFactor — multiply tabulated ampacity (ambient derating from {@link ambientTempDerateFactor}).
 */
export function minStandardMm2ForDesignCurrentA(
  designA: number,
  mode: CableAmpacityInstallMode,
  derateFactor = 1,
): number {
  if (!Number.isFinite(designA) || designA <= 0) return 0;
  const d = Number.isFinite(derateFactor) && derateFactor > 0 ? derateFactor : 1;
  for (const row of _AMPACITY_ROWS) {
    const base = mode === "free_air" ? row.freeAirA : row.bundledA;
    const cap = base * d;
    if (cap >= designA) return row.mm2;
  }
  return roundUpToStandardMm2(LAST.mm2);
}

/**
 * Tabellierter Dauerstrom [A] für einen **exakten** Standard-Querschnitt (PVC
 * Einleiter, {@link CableAmpacityInstallMode}). Unbekannte mm² → `0`.
 */
export function continuousAmpacityAForStandardMm2(
  mm2: number,
  mode: CableAmpacityInstallMode,
  derateFactor = 1,
): number {
  const d = Number.isFinite(derateFactor) && derateFactor > 0 ? derateFactor : 1;
  for (const row of _AMPACITY_ROWS) {
    if (row.mm2 === mm2) {
      const base = mode === "free_air" ? row.freeAirA : row.bundledA;
      return base * d;
    }
  }
  return 0;
}
