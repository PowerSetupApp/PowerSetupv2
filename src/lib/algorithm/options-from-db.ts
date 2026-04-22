import type { AlgorithmSettings } from "@/generated/prisma/client";
import { parseJsonMatrixField } from "@/lib/schemas/algorithm-settings-matrices";

import type { AlgorithmTuning, ComputeOptions } from "./algorithm-tuning";

/**
 * Maps a persisted `AlgorithmSettings` row into partial algorithm overrides.
 * `null` → `{}` so `mergeAlgorithmTuning` yields code defaults (`constants.ts`).
 */
export function algorithmSettingsToComputeOptions(row: AlgorithmSettings | null): ComputeOptions {
  if (!row) return {};
  const partial: Partial<AlgorithmTuning> = {};

  const m = <K extends Parameters<typeof parseJsonMatrixField>[0]>(key: K, raw: unknown) => {
    const v = parseJsonMatrixField(key, raw);
    if (v !== undefined) {
      (partial as Record<string, unknown>)[key] = v;
    }
  };

  m("maxAutarchyDays", row.maxAutarchyDays);
  m("pshTable", row.pshTable);
  m("solarBagAlignmentUplift", row.solarBagAlignmentUplift);
  m("driveHoursPerDay", row.driveHoursPerDay);
  m("dodDefaults", row.dodDefaults);
  m("roundtripDefaults", row.roundtripDefaults);
  m("cRateChargeMax", row.cRateChargeMax);
  m("absorptionTailH", row.absorptionTailH);
  m("chargerTargetCRate", row.chargerTargetCRate);
  m("shoreBridgeReliefDays", row.shoreBridgeReliefDays);
  m("alternatorBridgeStandingCredit", row.alternatorBridgeStandingCredit);
  m("topUpCoverageStandingCapMult", row.topUpCoverageStandingCapMult);
  m("peakFactor", row.peakFactor);

  partial.batterySafetyFactor = row.batterySafetyFactor;
  partial.autarchyPshDerate = row.autarchyPshDerate;
  partial.autarchyMaxBridgeDays = row.autarchyMaxBridgeDays;
  partial.hardBridgeDays = row.hardBridgeDays;
  partial.topUpCoverageCap = row.topUpCoverageCap;
  partial.topUpCoverageCapAtLowPsh = row.topUpCoverageCapAtLowPsh;
  partial.topUpCoveragePshBandHigh = row.topUpCoveragePshBandHigh;
  partial.topUpCoveragePshBandLow = row.topUpCoveragePshBandLow;
  partial.topUpCoveragePortableWeight = row.topUpCoveragePortableWeight;
  partial.topUpCoveragePortableCapBump = row.topUpCoveragePortableCapBump;
  partial.topUpCoverageAbsMax = row.topUpCoverageAbsMax;
  partial.shoreBatteryReliefAutarchyThresholdDays = row.shoreBatteryReliefAutarchyThresholdDays;

  partial.inverterEfficiency = row.inverterEfficiency;
  partial.inverterStandbyW = row.inverterStandbyW;
  partial.inverterStandbyHours = row.inverterStandbyHours;
  partial.alternatorContinuousLimitA = row.alternatorContinuousLimitA;
  partial.boosterEfficiency = row.boosterEfficiency;
  partial.chargerEfficiency = row.chargerEfficiency;

  partial.solarSystemEfficiency = row.solarSystemEfficiency;
  partial.wpPerM2Rigid = row.wpPerM2Rigid;
  partial.wpPerM2Flexible = row.wpPerM2Flexible;
  partial.roofUtilizationFactor = row.roofUtilizationFactor;
  partial.solarBagUtilization = row.solarBagUtilization;

  partial.voltageDropCritical = row.voltageDropCritical;
  partial.voltageDropNormal = row.voltageDropNormal;
  partial.copperResistivity = row.copperResistivity;

  return partial as ComputeOptions;
}
