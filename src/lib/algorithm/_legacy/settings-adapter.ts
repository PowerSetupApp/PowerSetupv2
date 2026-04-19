/**
 * Settings-Adapter: `AlgorithmSettings` (Prisma) → `AlgorithmInput.settings + componentClasses`.
 *
 * Zweck: Die Admin-Dashboard-Werte landen 1:1 in den Algorithmus-Berechnungen.
 * Ohne diesen Adapter würde `getSetting(...)` immer nur die Fallback-Konstanten
 * aus `constants.ts` zurückgeben (historisches Problem).
 *
 * Unit-Konventionen (DB → Algorithmus):
 * - Voltage-Drops werden in der DB als Prozent gespeichert (z. B. `2` = 2 %),
 *   intern aber als Bruch (`0.02`) erwartet. Der Adapter konvertiert.
 * - DoD-Werte, Faktoren und Wirkungsgrade sind bereits Brüche (`0.95` usw.) — passen direkt.
 * - Komponentenklassen sind CSV-Strings; sie wandern in `componentClasses` als `number[]`.
 */

import type { AlgorithmSettings } from "@/generated/prisma/client";

import type { AlgorithmTrace } from "./trace";
import type {
  AlgorithmInput,
  AlgorithmSettingsData,
  ComponentClasses,
} from "./types";

/** Parst `"6,10,16,25"` → `[6, 10, 16, 25]`. Leere/fehlerhafte Strings → `undefined`. */
function parseCsvClasses(csv: string | null | undefined): number[] | undefined {
  if (!csv) return undefined;
  const parts = csv
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length === 0) return undefined;
  parts.sort((a, b) => a - b);
  return parts;
}

/** Konvertiert einen Prozent-Wert (z. B. `2.5`) in einen Bruch (`0.025`). */
function percentToFraction(value: number | null | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value / 100;
}

function num(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Extrahiert aus einem `AlgorithmSettings`-Row das, was der Algorithmus wirklich nutzt.
 *
 * Rückgabe ist `undefined` für Felder, die nicht gesetzt sind — so bleibt der
 * Fallback-Pfad in `getSetting()` intakt (Tests ohne Settings funktionieren weiter).
 */
export function normalizeSettingsRow(
  row: AlgorithmSettings | null | undefined,
): { settings: AlgorithmSettingsData; componentClasses: ComponentClasses } {
  if (!row) return { settings: {}, componentClasses: {} };

  const settings: AlgorithmSettingsData = {
    // DoD
    dodLifepo4: num(row.dodLifepo4),
    dodAgm: num(row.dodAgm),
    dodGel: num(row.dodGel),

    // Battery
    batterySafetyFactor: num(row.batterySafetyFactor),
    maxBackupDays: num(row.maxBackupDays),

    // Standing days
    standingDaysShort: num(row.standingDaysShort),
    standingDaysMedium: num(row.standingDaysMedium),
    standingDaysLong: num(row.standingDaysLong),

    // Simultaneous
    simultaneousLow: num(row.simultaneousLow),
    simultaneousModerate: num(row.simultaneousModerate),
    simultaneousHigh: num(row.simultaneousHigh),

    // Duty cycles
    dutyCycleCompressor: num(row.dutyCycleCompressor),
    dutyCycleAbsorber: num(row.dutyCycleAbsorber),

    // Alternator / booster
    alternatorStandard: num(row.alternatorStandard),
    alternatorEnhanced: num(row.alternatorEnhanced),
    boosterEfficiency: num(row.boosterEfficiency),
    alternatorDriveHours: num(row.alternatorDriveHours),

    // Charger
    chargerTimeHoursSlow: num(row.chargerTimeHoursSlow),
    chargerTimeHoursNormal: num(row.chargerTimeHoursNormal),
    chargerTimeHoursFast: num(row.chargerTimeHoursFast),
    chargerAbsorptionOverhead: num(row.chargerAbsorptionOverhead),

    // Sun hours + location multipliers
    sunHoursSummer: num(row.sunHoursSummer),
    sunHoursAllYear: num(row.sunHoursAllYear),
    sunHoursWinter: num(row.sunHoursWinter),
    locationGermanyAlps: num(row.locationGermanyAlps),
    locationSouthernEurope: num(row.locationSouthernEurope),
    locationScandinavia: num(row.locationScandinavia),
    locationEastern: num(row.locationEastern),
    locationVaries: num(row.locationVaries),

    // Solar factors
    cloudyYieldFactor: num(row.cloudyYieldFactor),
    cloudyYieldFactorSummer: num(row.cloudyYieldFactorSummer),
    cloudyYieldFactorWinter: num(row.cloudyYieldFactorWinter),
    recommendedSolarYieldFactor: num(row.recommendedSolarYieldFactor),
    maxPortableWp: num(row.maxPortableWp),

    // Solar panel & roof
    wpPerM2Rigid: num(row.wpPerM2Rigid),
    wpPerM2Flexible: num(row.wpPerM2Flexible),
    roofUtilizationFactor: num(row.roofUtilizationFactor),
    roofOrientationFactor: num(row.roofOrientationFactor),
    portableOrientationFactor: num(row.portableOrientationFactor),
    solarSystemEfficiency: num(row.solarSystemEfficiency),
    solarSafetyFactor: num(row.solarSafetyFactor),

    // Wiring — percent columns → fraction
    voltageDropCritical: percentToFraction(row.voltageDropCritical),
    voltageDropNormal: percentToFraction(row.voltageDropNormal),
    voltageDropSolar: percentToFraction(row.voltageDropSolar),
    copperResistivity: num(row.copperResistivity),
  };

  // `undefined`-Einträge entfernen, damit `getSetting` sauber auf Fallback fällt,
  // falls eine DB-Spalte irgendwann einmal `null` liefern sollte.
  for (const k of Object.keys(settings) as (keyof AlgorithmSettingsData)[]) {
    if (settings[k] === undefined) delete settings[k];
  }

  const componentClasses: ComponentClasses = {
    inverter: parseCsvClasses(row.inverterClasses),
    charger: parseCsvClasses(row.chargerClasses),
    solarController: parseCsvClasses(row.solarControllerClasses),
    cable: parseCsvClasses(row.cableSizes),
  };

  return { settings, componentClasses };
}

/**
 * Merge eines Settings-Rows in einen `AlgorithmInput` — bestehende Overrides aus
 * dem Input (etwa aus Tests) bleiben erhalten und haben Vorrang.
 *
 * Wird ein `trace` übergeben, dann werden die Provenance-Snapshots (DB-Werte +
 * Input-Overrides) im Trace hinterlegt, damit `tracedGetSetting` die Quelle
 * jeder Konstante bestimmen kann.
 */
export function mergeAlgorithmSettings(
  input: AlgorithmInput,
  row: AlgorithmSettings | null | undefined,
  trace?: AlgorithmTrace,
): AlgorithmInput {
  const { settings, componentClasses } = normalizeSettingsRow(row);
  const inputOverrides: AlgorithmSettingsData = { ...(input.settings ?? {}) };

  if (trace) {
    trace.dbSettings = { ...settings };
    trace.inputOverrides = inputOverrides;
    trace.meta.hasDbRow = row != null;
    if (row && (row as { updatedAt?: Date }).updatedAt instanceof Date) {
      trace.meta.dbUpdatedAt = (row as { updatedAt: Date }).updatedAt.toISOString();
    }
  }

  return {
    ...input,
    settings: { ...settings, ...inputOverrides },
    componentClasses: { ...componentClasses, ...(input.componentClasses ?? {}) },
  };
}
