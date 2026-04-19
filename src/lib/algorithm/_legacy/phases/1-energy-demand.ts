import type {
  AlgorithmInput,
  ChargerSpeed,
  Consumer,
  RoofModuleType,
  Season,
  SimultaneousLoad,
  StandingDuration,
  WinterLocation,
} from "../types";
import type { AlgorithmTrace } from "../trace";
import { pushStep, pushWarning } from "../trace";
import {
  ALL_YEAR_PSH_MULTIPLIER,
  CABLE_AMPACITY_LIMITS,
  CHARGER_TIME_HOURS_FAST,
  CHARGER_TIME_HOURS_NORMAL,
  CHARGER_TIME_HOURS_SLOW,
  DUTY_CYCLE_ABSORBER,
  DUTY_CYCLE_COMPRESSOR,
  PSH_MATRIX,
  SIMULTANEOUS_HIGH,
  SIMULTANEOUS_LOW,
  SIMULTANEOUS_MODERATE,
  STANDING_DAYS_MAP,
  WP_PER_M2_FLEXIBLE,
  WP_PER_M2_RIGID,
} from "../constants";
import { getSetting } from "./settings";

/**
 * Peak-Sun-Hours (PSH) — zwei Pfade:
 *
 * 1. Admin-gepflegte Werte (Produktion): `sunHoursSummer/AllYear/Winter` werden mit
 *    dem Location-Multiplikator kombiniert → `psh = base × multiplier`. Konfigurierbar.
 * 2. Fallback (Tests / ohne Settings): `PSH_MATRIX` bleibt als empirische Tabelle erhalten,
 *    damit bestehende Snapshot-Tests grün bleiben.
 *
 * Der Wechsel zwischen beiden Pfaden hängt daran, ob eine relevante Sun-Hours-Spalte
 * im Input gesetzt ist. So bricht die Altlast nichts, sobald der Adapter aktiv ist.
 */
export function getPSH(
  season: Season,
  winterLocation: WinterLocation,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  const hasAdminPsh =
    typeof input?.settings?.sunHoursSummer === "number" ||
    typeof input?.settings?.sunHoursWinter === "number" ||
    typeof input?.settings?.sunHoursAllYear === "number";

  if (input && hasAdminPsh) {
    const base =
      season === "summer"
        ? getSetting(input, "sunHoursSummer", PSH_MATRIX[winterLocation].summer, "energy", trace)
        : season === "winter"
          ? getSetting(input, "sunHoursWinter", PSH_MATRIX[winterLocation].winter, "energy", trace)
          : getSetting(input, "sunHoursAllYear", PSH_MATRIX[winterLocation].mix, "energy", trace);

    const multiplier =
      winterLocation === "germany"
        ? getSetting(input, "locationGermanyAlps", 0.8, "energy", trace)
        : winterLocation === "southern"
          ? getSetting(input, "locationSouthernEurope", 1.2, "energy", trace)
          : winterLocation === "scandinavia"
            ? getSetting(input, "locationScandinavia", 0.6, "energy", trace)
            : winterLocation === "eastern"
              ? getSetting(input, "locationEastern", 0.9, "energy", trace)
              : getSetting(input, "locationVaries", 1.0, "energy", trace);

    return base * multiplier;
  }

  const regionData = PSH_MATRIX[winterLocation];
  switch (season) {
    case "summer":
      return regionData.summer;
    case "winter":
      return regionData.winter;
    case "all_year":
      return regionData.winter * ALL_YEAR_PSH_MULTIPLIER;
    default:
      return regionData.summer;
  }
}

export function getWpPerM2(
  roofModuleType: RoofModuleType,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  switch (roofModuleType) {
    case "rigid":
      return input
        ? getSetting(input, "wpPerM2Rigid", WP_PER_M2_RIGID, "solar", trace)
        : WP_PER_M2_RIGID;
    case "flexible":
      return input
        ? getSetting(input, "wpPerM2Flexible", WP_PER_M2_FLEXIBLE, "solar", trace)
        : WP_PER_M2_FLEXIBLE;
    default:
      return input
        ? getSetting(input, "wpPerM2Rigid", WP_PER_M2_RIGID, "solar", trace)
        : WP_PER_M2_RIGID;
  }
}

export function getChargerTimeHours(
  chargerSpeed: ChargerSpeed,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  switch (chargerSpeed) {
    case "slow":
      return input
        ? getSetting(input, "chargerTimeHoursSlow", CHARGER_TIME_HOURS_SLOW, "charger", trace)
        : CHARGER_TIME_HOURS_SLOW;
    case "normal":
      return input
        ? getSetting(input, "chargerTimeHoursNormal", CHARGER_TIME_HOURS_NORMAL, "charger", trace)
        : CHARGER_TIME_HOURS_NORMAL;
    case "fast":
      return input
        ? getSetting(input, "chargerTimeHoursFast", CHARGER_TIME_HOURS_FAST, "charger", trace)
        : CHARGER_TIME_HOURS_FAST;
    default:
      return input
        ? getSetting(input, "chargerTimeHoursNormal", CHARGER_TIME_HOURS_NORMAL, "charger", trace)
        : CHARGER_TIME_HOURS_NORMAL;
  }
}

export function getSimultaneousFactor(
  simultaneousLoad: SimultaneousLoad,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  switch (simultaneousLoad) {
    case "low":
      return input
        ? getSetting(input, "simultaneousLow", SIMULTANEOUS_LOW, "inverter", trace)
        : SIMULTANEOUS_LOW;
    case "moderate":
      return input
        ? getSetting(input, "simultaneousModerate", SIMULTANEOUS_MODERATE, "inverter", trace)
        : SIMULTANEOUS_MODERATE;
    case "high":
      return input
        ? getSetting(input, "simultaneousHigh", SIMULTANEOUS_HIGH, "inverter", trace)
        : SIMULTANEOUS_HIGH;
    default:
      return input
        ? getSetting(input, "simultaneousModerate", SIMULTANEOUS_MODERATE, "inverter", trace)
        : SIMULTANEOUS_MODERATE;
  }
}

export function getStandingDays(
  standingDuration: StandingDuration,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  switch (standingDuration) {
    case "short":
      return input
        ? getSetting(input, "standingDaysShort", STANDING_DAYS_MAP.short, "booster", trace)
        : STANDING_DAYS_MAP.short;
    case "medium":
      return input
        ? getSetting(input, "standingDaysMedium", STANDING_DAYS_MAP.medium, "booster", trace)
        : STANDING_DAYS_MAP.medium;
    case "long":
      return input
        ? getSetting(input, "standingDaysLong", STANDING_DAYS_MAP.long, "booster", trace)
        : STANDING_DAYS_MAP.long;
    default:
      return input
        ? getSetting(input, "standingDaysMedium", STANDING_DAYS_MAP.medium, "booster", trace)
        : STANDING_DAYS_MAP.medium;
  }
}

export function roundUpTo50(value: number): number {
  return Math.ceil(value / 50) * 50;
}

export function roundUpTo100(value: number): number {
  return Math.ceil(value / 100) * 100;
}

export function roundUpToStandard(value: number, standards: readonly number[]): number {
  if (standards.length === 0) {
    return Math.ceil(value);
  }
  for (const std of standards) {
    if (value <= std) {
      return std;
    }
  }
  return standards[standards.length - 1];
}

export function roundToNearest(value: number, standards: readonly number[]): number {
  let closest = standards[0];
  let minDiff = Math.abs(value - closest);
  for (const std of standards) {
    const diff = Math.abs(value - std);
    if (diff < minDiff) {
      closest = std;
      minDiff = diff;
    }
  }
  return closest;
}

export function getMinCrossSectionForAmpacity(currentA: number): number {
  const sortedLimits = Object.entries(CABLE_AMPACITY_LIMITS)
    .map(([s, l]) => ({ size: parseFloat(s), limit: l }))
    .sort((a, b) => a.size - b.size);

  for (const { size, limit } of sortedLimits) {
    if (currentA <= limit) {
      return size;
    }
  }
  return 95;
}

/**
 * Effektive Durchschnittsleistung für die Tagesverbrauchsrechnung.
 *
 * Kataloggeräte können im Admin einen `averageLoadPercent` mitbringen
 * (z. B. Induktionsherd: 3000 W Nennleistung, 33 % Durchschnitt → 990 W).
 * Für Wechselrichter-/Peak-Dimensionierung bleibt `consumer.power` maßgeblich;
 * hier geht es ausschließlich um den Wh-Bedarf pro Tag.
 *
 * Edge cases:
 *  - `pct === 100` wird wie „kein Rabatt“ behandelt und explizit getraced.
 *  - `pct === 0` oder negativ wird als Konfigurationsfehler geloggt und wie
 *    volle Nennleistung behandelt (konservativ, damit der Algorithmus nicht
 *    plötzlich 0 Wh ausweist).
 */
function effectivePowerForDaily(
  consumer: Consumer,
  trace?: AlgorithmTrace,
): number {
  const pct = consumer.averageLoadPercent;
  if (typeof pct === "number") {
    if (pct > 0 && pct < 100) {
      return consumer.power * (pct / 100);
    }
    if (pct === 100) {
      return consumer.power;
    }
    if (pct <= 0) {
      pushWarning(trace, {
        phase: "energy",
        code: "consumer.averageLoadPercent.invalid",
        severity: "warn",
        message: `Verbraucher „${consumer.name}“ hat averageLoadPercent=${pct} — verwende volle Nennleistung ${consumer.power} W.`,
      });
      return consumer.power;
    }
  }
  return consumer.power;
}

export function calculateDailyConsumption(
  consumers: Consumer[],
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  let totalWh = 0;
  const dcCompressor = input
    ? getSetting(input, "dutyCycleCompressor", DUTY_CYCLE_COMPRESSOR, "energy", trace)
    : DUTY_CYCLE_COMPRESSOR;
  const dcAbsorber = input
    ? getSetting(input, "dutyCycleAbsorber", DUTY_CYCLE_ABSORBER, "energy", trace)
    : DUTY_CYCLE_ABSORBER;

  for (const consumer of consumers) {
    const effPower = effectivePowerForDaily(consumer, trace);
    let consumerWh: number;
    if (consumer.coolingMethod === "compressor") {
      consumerWh = effPower * consumer.daily * dcCompressor;
    } else if (consumer.coolingMethod === "absorber") {
      const electricShare = consumer.electricShare ?? 1.0;
      consumerWh = effPower * consumer.daily * dcAbsorber * electricShare;
    } else {
      consumerWh = effPower * consumer.daily;
    }
    totalWh += consumerWh;

    pushStep(trace, {
      phase: "energy",
      id: `energy.consumer.${consumer.id}`,
      label: consumer.name,
      value: Math.round(consumerWh),
      unit: "Wh/Tag",
      kind: "intermediate",
      formula: `${effPower.toFixed(1)} W × ${consumer.daily} h${
        consumer.coolingMethod === "compressor"
          ? ` × ${dcCompressor} (Kompressor-Duty)`
          : consumer.coolingMethod === "absorber"
            ? ` × ${dcAbsorber} (Absorber-Duty) × ${consumer.electricShare ?? 1.0} (elektr. Anteil)`
            : ""
      }`,
    });
  }
  return totalWh;
}
