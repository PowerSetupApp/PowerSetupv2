import type { AlgorithmInput, BatteryPreference, BatteryRecommendation } from "../types";
import {
  AUTARCHY_UNLIMITED,
  BATTERY_SAFETY_FACTOR,
  CLOUDY_YIELD_FACTOR,
  CLOUDY_YIELD_FACTOR_SUMMER,
  CLOUDY_YIELD_FACTOR_WINTER,
  DOD_AGM,
  DOD_GEL,
  DOD_LIFEPO4,
  MAX_BACKUP_DAYS,
  TRIP_MAX_BACKUP_DAYS,
} from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { roundUpTo50 } from "./1-energy-demand";
import { getSetting } from "./settings";

export function getDoD(
  batteryPreference: BatteryPreference,
  input?: AlgorithmInput,
  trace?: AlgorithmTrace,
): number {
  switch (batteryPreference) {
    case "lifepo4":
      return input ? getSetting(input, "dodLifepo4", DOD_LIFEPO4, "battery", trace) : DOD_LIFEPO4;
    case "agm":
      return input ? getSetting(input, "dodAgm", DOD_AGM, "battery", trace) : DOD_AGM;
    case "gel":
      return input ? getSetting(input, "dodGel", DOD_GEL, "battery", trace) : DOD_GEL;
    default:
      return input ? getSetting(input, "dodLifepo4", DOD_LIFEPO4, "battery", trace) : DOD_LIFEPO4;
  }
}

/**
 * Dimensioniert die Versorgerbatterie.
 *
 * Kernidee: die Batterie muss an „schlechten“ Tagen die Lücke zwischen
 * Tagesverbrauch und Nachladung (Solar × Bewölkungsfaktor + Alternator)
 * über N Autarkie-Tage puffern, gepuffert mit Sicherheitsfaktor und
 * Entladetiefe.
 *
 * Der frühere `solarShortfallWh`-Add-on wurde gestrichen (überlappte mit der
 * `deficit`-Rechnung und führte zu systematischer Überdimensionierung bei
 * bewölkten Szenarien). Er bleibt nur noch am Solar-Output für die UI.
 */
export function calculateBattery(
  input: AlgorithmInput,
  dailyWh: number,
  solarYieldWh: number,
  alternatorWh: number,
  _solarShortfallWh: number = 0,
  trace?: AlgorithmTrace,
): BatteryRecommendation {
  const dod = getDoD(input.batteryPreference, input, trace);
  const hasSolar = input.energySources.includes("solar");
  const hasAlternator = input.energySources.includes("alternator");

  const cloudFactorSummer = getSetting(
    input,
    "cloudyYieldFactorSummer",
    CLOUDY_YIELD_FACTOR_SUMMER,
    "battery",
    trace,
  );
  const cloudFactorWinter = getSetting(
    input,
    "cloudyYieldFactorWinter",
    CLOUDY_YIELD_FACTOR_WINTER,
    "battery",
    trace,
  );
  const cloudFactorGeneral = getSetting(
    input,
    "cloudyYieldFactor",
    CLOUDY_YIELD_FACTOR,
    "battery",
    trace,
  );
  const maxBackup = getSetting(input, "maxBackupDays", MAX_BACKUP_DAYS, "battery", trace);
  const safetyFactor = getSetting(
    input,
    "batterySafetyFactor",
    BATTERY_SAFETY_FACTOR,
    "battery",
    trace,
  );

  let seasonalCloudyFactor: number;
  switch (input.travelBehavior.season) {
    case "summer":
      seasonalCloudyFactor = cloudFactorSummer;
      break;
    case "winter":
      seasonalCloudyFactor = cloudFactorWinter;
      break;
    default:
      seasonalCloudyFactor = cloudFactorGeneral;
  }

  const badWeatherSolarYieldWh = solarYieldWh * seasonalCloudyFactor;
  const totalChargingWh = badWeatherSolarYieldWh + alternatorWh;
  const deficit = Math.max(0, dailyWh - totalChargingWh);

  const seasonalMaxBackup = input.travelBehavior.season === "summer" ? 3 : maxBackup;
  const tripMaxBackup = TRIP_MAX_BACKUP_DAYS[input.travelBehavior.tripDuration] || maxBackup;
  const effectiveMaxBackup = Math.min(seasonalMaxBackup, tripMaxBackup);

  let backupDays: number;
  if (input.autarchyDays === AUTARCHY_UNLIMITED) {
    if (solarYieldWh < dailyWh) {
      console.warn("⚠️ Solar reicht nicht für Vollautarkie! Solar:", solarYieldWh, "Wh, Bedarf:", dailyWh, "Wh");
    }
    backupDays = effectiveMaxBackup;
  } else {
    backupDays = Math.min(input.autarchyDays, effectiveMaxBackup);
  }

  const rawCapacityWh = deficit * backupDays;
  const bufferedCapacityWh = rawCapacityWh * safetyFactor;
  let minCapacityAh = bufferedCapacityWh / (input.systemVoltage * dod);

  const nightHoursFraction = 14 / 24;
  const nightConsumptionWh = dailyWh * nightHoursFraction;
  const nightCapacityAh = (nightConsumptionWh * safetyFactor) / (input.systemVoltage * dod);
  minCapacityAh = Math.max(minCapacityAh, nightCapacityAh);

  const recommendedCapacityAh = roundUpTo50(minCapacityAh);

  pushStep(trace, {
    phase: "battery",
    id: "battery.deficit",
    label: "Tägliches Defizit",
    value: Math.round(deficit),
    unit: "Wh/Tag",
    kind: "intermediate",
    formula: `max(0, ${Math.round(dailyWh)} Wh − (${Math.round(
      badWeatherSolarYieldWh,
    )} Wh solar × Cloudy ${seasonalCloudyFactor} + ${Math.round(alternatorWh)} Wh Alternator))`,
  });
  pushStep(trace, {
    phase: "battery",
    id: "battery.rawCapacityWh",
    label: "Roh-Kapazität",
    value: Math.round(rawCapacityWh),
    unit: "Wh",
    kind: "intermediate",
    formula: `deficit × backupDays = ${Math.round(deficit)} × ${backupDays}`,
  });
  pushStep(trace, {
    phase: "battery",
    id: "battery.minCapacityAh",
    label: "Mindestkapazität",
    value: Math.round(minCapacityAh),
    unit: "Ah",
    kind: "intermediate",
    formula: `(Wh × ${safetyFactor}) / (${input.systemVoltage} V × DoD ${dod})`,
  });
  pushStep(trace, {
    phase: "battery",
    id: "battery.recommendedCapacityAh",
    label: "Empfohlene Kapazität",
    value: recommendedCapacityAh,
    unit: "Ah",
    kind: "output",
    formula: `roundUpTo50(${Math.round(minCapacityAh)})`,
  });

  return {
    dailyWh: Math.round(dailyWh),
    minCapacityAh: Math.round(minCapacityAh),
    recommendedCapacityAh,
    type: input.batteryPreference,
    voltage: input.systemVoltage,
    autarchyDays: backupDays,
    hasSolar,
    hasAlternator,
  };
}
