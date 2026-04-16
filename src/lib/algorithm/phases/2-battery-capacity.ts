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
import { roundUpTo50 } from "./1-energy-demand";
import { getSetting } from "./settings";

export function getDoD(batteryPreference: BatteryPreference, input?: AlgorithmInput): number {
  switch (batteryPreference) {
    case "lifepo4":
      return input ? getSetting(input, "dodLifepo4", DOD_LIFEPO4) : DOD_LIFEPO4;
    case "agm":
      return input ? getSetting(input, "dodAgm", DOD_AGM) : DOD_AGM;
    case "gel":
      return input ? getSetting(input, "dodGel", DOD_GEL) : DOD_GEL;
    default:
      return input ? getSetting(input, "dodLifepo4", DOD_LIFEPO4) : DOD_LIFEPO4;
  }
}

export function calculateBattery(
  input: AlgorithmInput,
  dailyWh: number,
  solarYieldWh: number,
  alternatorWh: number,
  solarShortfallWh: number = 0,
): BatteryRecommendation {
  const dod = getDoD(input.batteryPreference, input);
  const hasSolar = input.energySources.includes("solar");
  const hasAlternator = input.energySources.includes("alternator");

  const cloudFactorSummer = getSetting(input, "cloudyYieldFactorSummer", CLOUDY_YIELD_FACTOR_SUMMER);
  const cloudFactorWinter = getSetting(input, "cloudyYieldFactorWinter", CLOUDY_YIELD_FACTOR_WINTER);
  const cloudFactorGeneral = getSetting(input, "cloudyYieldFactor", CLOUDY_YIELD_FACTOR);
  const maxBackup = getSetting(input, "maxBackupDays", MAX_BACKUP_DAYS);
  const safetyFactor = getSetting(input, "batterySafetyFactor", BATTERY_SAFETY_FACTOR);

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

  let deficit = dailyWh - totalChargingWh;
  if (deficit < 0) {
    deficit = 0;
  }

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

  if (solarShortfallWh > 0 && hasSolar) {
    const shortfallCapacityAh = (solarShortfallWh * backupDays * safetyFactor) / (input.systemVoltage * dod);
    const isShortTrip = ["weekend", "week"].includes(input.travelBehavior.tripDuration);
    const shortfallFactor = isShortTrip ? 1.0 : 0.5;
    minCapacityAh = minCapacityAh + shortfallCapacityAh * shortfallFactor;
  }

  const recommendedCapacityAh = roundUpTo50(minCapacityAh);

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
