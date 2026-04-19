import { applyCustomOverrides } from "@/lib/algorithm/apply-custom-overrides";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

const F_MAX = 1 - 1e-9;

/**
 * Applies the step-8 "Solar-Abdeckung" slider: `f = 1` → algorithm defaults
 * (null overrides); `f = 0` → battery-only sizing + zero solar override.
 */
export function buildStep8BalanceOutput(
  rawBase: AlgorithmOutput,
  rawBatteryOnly: AlgorithmOutput,
  f: number,
  hasSolar: boolean,
  customOverrides: AlgorithmInput["customOverrides"],
): AlgorithmOutput {
  if (!hasSolar || !rawBase.solar.needed) return rawBase;

  const capWp = Math.min(
    rawBase.solar.requiredWp,
    rawBase.solar.maxRoofWp + rawBase.solar.portableWp,
  );
  const batLo = rawBatteryOnly.battery.recommendedCapacityAh;
  const batHi = rawBase.battery.recommendedCapacityAh;
  const clampedF = Math.min(1, Math.max(0, f));

  if (clampedF >= F_MAX) {
    return applyCustomOverrides(rawBase, {
      ...customOverrides,
      battery: null,
      solar: null,
    });
  }

  const solarTarget = clampedF * capWp;
  const batteryTarget = batLo + clampedF * (batHi - batLo);

  return applyCustomOverrides(rawBase, {
    ...customOverrides,
    battery: batteryTarget,
    solar: solarTarget,
  });
}
