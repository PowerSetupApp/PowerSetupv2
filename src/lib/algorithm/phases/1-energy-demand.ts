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

export function getPSH(season: Season, winterLocation: WinterLocation, input?: AlgorithmInput): number {
  const regionData = PSH_MATRIX[winterLocation];
  const allYearMultiplier = input
    ? getSetting(input, "allYearPshMultiplier", ALL_YEAR_PSH_MULTIPLIER)
    : ALL_YEAR_PSH_MULTIPLIER;

  switch (season) {
    case "summer":
      return regionData.summer;
    case "winter":
      return regionData.winter;
    case "all_year":
      return regionData.winter * allYearMultiplier;
    default:
      return regionData.summer;
  }
}

export function getWpPerM2(roofModuleType: RoofModuleType, input?: AlgorithmInput): number {
  switch (roofModuleType) {
    case "rigid":
      return input ? getSetting(input, "wpPerM2Rigid", WP_PER_M2_RIGID) : WP_PER_M2_RIGID;
    case "flexible":
      return input ? getSetting(input, "wpPerM2Flexible", WP_PER_M2_FLEXIBLE) : WP_PER_M2_FLEXIBLE;
    default:
      return input ? getSetting(input, "wpPerM2Rigid", WP_PER_M2_RIGID) : WP_PER_M2_RIGID;
  }
}

export function getChargerTimeHours(chargerSpeed: ChargerSpeed, input?: AlgorithmInput): number {
  switch (chargerSpeed) {
    case "slow":
      return input ? getSetting(input, "chargerTimeSlow", CHARGER_TIME_HOURS_SLOW) : CHARGER_TIME_HOURS_SLOW;
    case "normal":
      return input ? getSetting(input, "chargerTimeNormal", CHARGER_TIME_HOURS_NORMAL) : CHARGER_TIME_HOURS_NORMAL;
    case "fast":
      return input ? getSetting(input, "chargerTimeFast", CHARGER_TIME_HOURS_FAST) : CHARGER_TIME_HOURS_FAST;
    default:
      return input ? getSetting(input, "chargerTimeNormal", CHARGER_TIME_HOURS_NORMAL) : CHARGER_TIME_HOURS_NORMAL;
  }
}

export function getSimultaneousFactor(simultaneousLoad: SimultaneousLoad, input?: AlgorithmInput): number {
  switch (simultaneousLoad) {
    case "low":
      return input ? getSetting(input, "simultaneousFactorLow", SIMULTANEOUS_LOW) : SIMULTANEOUS_LOW;
    case "moderate":
      return input
        ? getSetting(input, "simultaneousFactorModerate", SIMULTANEOUS_MODERATE)
        : SIMULTANEOUS_MODERATE;
    case "high":
      return input ? getSetting(input, "simultaneousFactorHigh", SIMULTANEOUS_HIGH) : SIMULTANEOUS_HIGH;
    default:
      return input
        ? getSetting(input, "simultaneousFactorModerate", SIMULTANEOUS_MODERATE)
        : SIMULTANEOUS_MODERATE;
  }
}

export function getStandingDays(standingDuration: StandingDuration, input?: AlgorithmInput): number {
  switch (standingDuration) {
    case "short":
      return input ? getSetting(input, "standingDaysShort", STANDING_DAYS_MAP.short) : STANDING_DAYS_MAP.short;
    case "medium":
      return input ? getSetting(input, "standingDaysMedium", STANDING_DAYS_MAP.medium) : STANDING_DAYS_MAP.medium;
    case "long":
      return input ? getSetting(input, "standingDaysLong", STANDING_DAYS_MAP.long) : STANDING_DAYS_MAP.long;
    default:
      return input ? getSetting(input, "standingDaysMedium", STANDING_DAYS_MAP.medium) : STANDING_DAYS_MAP.medium;
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

export function calculateDailyConsumption(consumers: Consumer[], input?: AlgorithmInput): number {
  let totalWh = 0;
  const dcCompressor = input
    ? getSetting(input, "dutyCycleCompressor", DUTY_CYCLE_COMPRESSOR)
    : DUTY_CYCLE_COMPRESSOR;
  const dcAbsorber = input ? getSetting(input, "dutyCycleAbsorber", DUTY_CYCLE_ABSORBER) : DUTY_CYCLE_ABSORBER;

  for (const consumer of consumers) {
    let consumerWh: number;
    if (consumer.coolingMethod === "compressor") {
      consumerWh = consumer.power * consumer.daily * dcCompressor;
    } else if (consumer.coolingMethod === "absorber") {
      const electricShare = consumer.electricShare ?? 1.0;
      consumerWh = consumer.power * consumer.daily * dcAbsorber * electricShare;
    } else {
      consumerWh = consumer.power * consumer.daily;
    }
    totalWh += consumerWh;
  }
  return totalWh;
}
