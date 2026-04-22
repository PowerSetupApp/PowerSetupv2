/**
 * Tunable algorithm parameters — merged from code defaults (`constants.ts`)
 * and optional overrides (DB / `ComputeOptions`).
 */

import type { AutarchyTopUpProfile } from "./constants";
import {
  ABSORPTION_TAIL_H,
  ALTERNATOR_BRIDGE_STANDING_CREDIT,
  ALTERNATOR_CONTINUOUS_LIMIT_A,
  AUTARCHY_MAX_BRIDGE_DAYS,
  AUTARCHY_PSH_DERATE,
  BOOSTER_EFFICIENCY,
  CHARGER_EFFICIENCY,
  CHARGER_TARGET_C_RATE,
  COPPER_RHO,
  C_RATE_CHARGE_MAX,
  CRITICAL_DU_MAX_PCT,
  DOD_DEFAULTS,
  DRIVE_HOURS_PER_DAY,
  HARD_BRIDGE_DAYS,
  INVERTER_EFFICIENCY,
  INVERTER_STANDBY_HOURS,
  INVERTER_STANDBY_W,
  MAX_AUTARCHY_DAYS,
  PEAK_FACTOR,
  PSH_TABLE,
  RESERVE_FACTOR,
  ROOF_PACKING_FACTOR,
  ROUNDTRIP_DEFAULTS,
  SHORE_BATTERY_RELIEF_AUTARCHY_THRESHOLD_DAYS,
  SHORE_BRIDGE_RELIEF_DAYS,
  SOLAR_BAG_ALIGNMENT_UPLIFT,
  SOLAR_BAG_UTILIZATION,
  SOLAR_SYSTEM_EFFICIENCY,
  STANDARD_DU_MAX_PCT,
  TOP_UP_COVERAGE_ABS_MAX,
  TOP_UP_COVERAGE_CAP,
  TOP_UP_COVERAGE_CAP_AT_LOW_PSH,
  TOP_UP_COVERAGE_PORTABLE_CAP_BUMP,
  TOP_UP_COVERAGE_PORTABLE_WEIGHT,
  TOP_UP_COVERAGE_PSH_BAND_HIGH,
  TOP_UP_COVERAGE_PSH_BAND_LOW,
  TOP_UP_COVERAGE_STANDING_CAP_MULT,
  WP_PER_M2,
} from "./constants";
import type {
  BatteryPreference,
  Season,
  ShoreAvailability,
  SimultaneousLoad,
  StandingDuration,
  TripDuration,
  WinterLocation,
} from "./types";

export interface AlgorithmTuning {
  maxAutarchyDays: Record<TripDuration, Record<AutarchyTopUpProfile, number>>;
  pshTable: Record<WinterLocation, Record<Season, number>>;
  solarBagAlignmentUplift: Record<WinterLocation, Record<Season, number>>;
  driveHoursPerDay: Record<TripDuration, Record<StandingDuration, number>>;
  dodDefaults: Record<BatteryPreference, number>;
  roundtripDefaults: Record<BatteryPreference, number>;
  cRateChargeMax: Record<BatteryPreference, number>;
  absorptionTailH: Record<BatteryPreference, number>;
  chargerTargetCRate: Record<Exclude<ShoreAvailability, "never">, number>;
  shoreBridgeReliefDays: Record<ShoreAvailability, number>;
  alternatorBridgeStandingCredit: Record<StandingDuration, number>;
  topUpCoverageStandingCapMult: Record<StandingDuration, number>;
  peakFactor: Record<SimultaneousLoad, number>;

  batterySafetyFactor: number;
  autarchyPshDerate: number;
  autarchyMaxBridgeDays: number;
  hardBridgeDays: number;
  topUpCoverageCap: number;
  topUpCoverageCapAtLowPsh: number;
  topUpCoveragePshBandHigh: number;
  topUpCoveragePshBandLow: number;
  topUpCoveragePortableWeight: number;
  topUpCoveragePortableCapBump: number;
  topUpCoverageAbsMax: number;
  shoreBatteryReliefAutarchyThresholdDays: number;

  inverterEfficiency: number;
  inverterStandbyW: number;
  inverterStandbyHours: number;
  alternatorContinuousLimitA: number;
  boosterEfficiency: number;
  chargerEfficiency: number;

  solarSystemEfficiency: number;
  wpPerM2Rigid: number;
  wpPerM2Flexible: number;
  roofUtilizationFactor: number;
  solarBagUtilization: number;

  voltageDropCritical: number;
  voltageDropNormal: number;
  copperResistivity: number;
}

/** Code defaults — mirror of `constants.ts` (pre-DB tuning). */
export const DEFAULT_ALGORITHM_TUNING: AlgorithmTuning = {
  maxAutarchyDays: MAX_AUTARCHY_DAYS,
  pshTable: PSH_TABLE,
  solarBagAlignmentUplift: SOLAR_BAG_ALIGNMENT_UPLIFT,
  driveHoursPerDay: DRIVE_HOURS_PER_DAY,
  dodDefaults: DOD_DEFAULTS,
  roundtripDefaults: ROUNDTRIP_DEFAULTS,
  cRateChargeMax: C_RATE_CHARGE_MAX,
  absorptionTailH: ABSORPTION_TAIL_H,
  chargerTargetCRate: CHARGER_TARGET_C_RATE,
  shoreBridgeReliefDays: SHORE_BRIDGE_RELIEF_DAYS,
  alternatorBridgeStandingCredit: ALTERNATOR_BRIDGE_STANDING_CREDIT,
  topUpCoverageStandingCapMult: TOP_UP_COVERAGE_STANDING_CAP_MULT,
  peakFactor: PEAK_FACTOR,

  batterySafetyFactor: RESERVE_FACTOR,
  autarchyPshDerate: AUTARCHY_PSH_DERATE,
  autarchyMaxBridgeDays: AUTARCHY_MAX_BRIDGE_DAYS,
  hardBridgeDays: HARD_BRIDGE_DAYS,
  topUpCoverageCap: TOP_UP_COVERAGE_CAP,
  topUpCoverageCapAtLowPsh: TOP_UP_COVERAGE_CAP_AT_LOW_PSH,
  topUpCoveragePshBandHigh: TOP_UP_COVERAGE_PSH_BAND_HIGH,
  topUpCoveragePshBandLow: TOP_UP_COVERAGE_PSH_BAND_LOW,
  topUpCoveragePortableWeight: TOP_UP_COVERAGE_PORTABLE_WEIGHT,
  topUpCoveragePortableCapBump: TOP_UP_COVERAGE_PORTABLE_CAP_BUMP,
  topUpCoverageAbsMax: TOP_UP_COVERAGE_ABS_MAX,
  shoreBatteryReliefAutarchyThresholdDays: SHORE_BATTERY_RELIEF_AUTARCHY_THRESHOLD_DAYS,

  inverterEfficiency: INVERTER_EFFICIENCY,
  inverterStandbyW: INVERTER_STANDBY_W,
  inverterStandbyHours: INVERTER_STANDBY_HOURS,
  alternatorContinuousLimitA: ALTERNATOR_CONTINUOUS_LIMIT_A,
  boosterEfficiency: BOOSTER_EFFICIENCY,
  chargerEfficiency: CHARGER_EFFICIENCY,

  solarSystemEfficiency: SOLAR_SYSTEM_EFFICIENCY,
  wpPerM2Rigid: WP_PER_M2.rigid,
  wpPerM2Flexible: WP_PER_M2.flexible,
  roofUtilizationFactor: ROOF_PACKING_FACTOR,
  solarBagUtilization: SOLAR_BAG_UTILIZATION,

  voltageDropCritical: CRITICAL_DU_MAX_PCT,
  voltageDropNormal: STANDARD_DU_MAX_PCT,
  copperResistivity: COPPER_RHO,
};

function mergeRecord<K extends string, V>(
  base: Record<K, V>,
  over?: Partial<Record<K, V>> | null,
): Record<K, V> {
  if (!over) return base;
  return { ...base, ...over };
}

function mergeNested2<K1 extends string, K2 extends string, V>(
  base: Record<K1, Record<K2, V>>,
  over?: Partial<Record<K1, Partial<Record<K2, V>>>> | null,
): Record<K1, Record<K2, V>> {
  if (!over) return base;
  const out = { ...base } as Record<K1, Record<K2, V>>;
  for (const k1 of Object.keys(over) as K1[]) {
    const patch = over[k1];
    if (!patch) continue;
    out[k1] = { ...base[k1], ...patch };
  }
  return out;
}

/**
 * Merge partial overrides onto code defaults. Used for DB rows and `ComputeOptions`.
 */
export function mergeAlgorithmTuning(overrides: Partial<AlgorithmTuning> | null | undefined): AlgorithmTuning {
  const o = overrides ?? {};
  const d = DEFAULT_ALGORITHM_TUNING;
  return {
    maxAutarchyDays: mergeNested2(d.maxAutarchyDays, o.maxAutarchyDays),
    pshTable: mergeNested2(d.pshTable, o.pshTable),
    solarBagAlignmentUplift: mergeNested2(d.solarBagAlignmentUplift, o.solarBagAlignmentUplift),
    driveHoursPerDay: mergeNested2(d.driveHoursPerDay, o.driveHoursPerDay),
    dodDefaults: mergeRecord(d.dodDefaults, o.dodDefaults),
    roundtripDefaults: mergeRecord(d.roundtripDefaults, o.roundtripDefaults),
    cRateChargeMax: mergeRecord(d.cRateChargeMax, o.cRateChargeMax),
    absorptionTailH: mergeRecord(d.absorptionTailH, o.absorptionTailH),
    chargerTargetCRate: mergeRecord(d.chargerTargetCRate, o.chargerTargetCRate),
    shoreBridgeReliefDays: mergeRecord(d.shoreBridgeReliefDays, o.shoreBridgeReliefDays),
    alternatorBridgeStandingCredit: mergeRecord(d.alternatorBridgeStandingCredit, o.alternatorBridgeStandingCredit),
    topUpCoverageStandingCapMult: mergeRecord(d.topUpCoverageStandingCapMult, o.topUpCoverageStandingCapMult),
    peakFactor: mergeRecord(d.peakFactor, o.peakFactor),

    batterySafetyFactor: o.batterySafetyFactor ?? d.batterySafetyFactor,
    autarchyPshDerate: o.autarchyPshDerate ?? d.autarchyPshDerate,
    autarchyMaxBridgeDays: o.autarchyMaxBridgeDays ?? d.autarchyMaxBridgeDays,
    hardBridgeDays: o.hardBridgeDays ?? d.hardBridgeDays,
    topUpCoverageCap: o.topUpCoverageCap ?? d.topUpCoverageCap,
    topUpCoverageCapAtLowPsh: o.topUpCoverageCapAtLowPsh ?? d.topUpCoverageCapAtLowPsh,
    topUpCoveragePshBandHigh: o.topUpCoveragePshBandHigh ?? d.topUpCoveragePshBandHigh,
    topUpCoveragePshBandLow: o.topUpCoveragePshBandLow ?? d.topUpCoveragePshBandLow,
    topUpCoveragePortableWeight: o.topUpCoveragePortableWeight ?? d.topUpCoveragePortableWeight,
    topUpCoveragePortableCapBump: o.topUpCoveragePortableCapBump ?? d.topUpCoveragePortableCapBump,
    topUpCoverageAbsMax: o.topUpCoverageAbsMax ?? d.topUpCoverageAbsMax,
    shoreBatteryReliefAutarchyThresholdDays:
      o.shoreBatteryReliefAutarchyThresholdDays ?? d.shoreBatteryReliefAutarchyThresholdDays,

    inverterEfficiency: o.inverterEfficiency ?? d.inverterEfficiency,
    inverterStandbyW: o.inverterStandbyW ?? d.inverterStandbyW,
    inverterStandbyHours: o.inverterStandbyHours ?? d.inverterStandbyHours,
    alternatorContinuousLimitA: o.alternatorContinuousLimitA ?? d.alternatorContinuousLimitA,
    boosterEfficiency: o.boosterEfficiency ?? d.boosterEfficiency,
    chargerEfficiency: o.chargerEfficiency ?? d.chargerEfficiency,

    solarSystemEfficiency: o.solarSystemEfficiency ?? d.solarSystemEfficiency,
    wpPerM2Rigid: o.wpPerM2Rigid ?? d.wpPerM2Rigid,
    wpPerM2Flexible: o.wpPerM2Flexible ?? d.wpPerM2Flexible,
    roofUtilizationFactor: o.roofUtilizationFactor ?? d.roofUtilizationFactor,
    solarBagUtilization: o.solarBagUtilization ?? d.solarBagUtilization,

    voltageDropCritical: o.voltageDropCritical ?? d.voltageDropCritical,
    voltageDropNormal: o.voltageDropNormal ?? d.voltageDropNormal,
    copperResistivity: o.copperResistivity ?? d.copperResistivity,
  };
}

export type ComputeOptions = {
  explain?: boolean;
  alternatorLimitA?: number;
} & Partial<AlgorithmTuning>;
