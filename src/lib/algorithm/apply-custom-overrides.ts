/**
 * Post-compute override hook.
 *
 * The new algorithm (`compute.ts`) is pure — it does not consume
 * `input.customOverrides`. This helper applies manual overrides from the
 * result page to the final `AlgorithmOutput`:
 *
 *   - `customOverrides.battery !== null`  ⇒ `battery.recommendedCapacityAh = battery`
 *   - `customOverrides.solar !== null`    ⇒ `solar.requiredWp = solar`;
 *     `solar.solarShortfallWh` is recomputed against the unchanged
 *     `dailySolarYieldWh` so the shortfall figure stays consistent.
 *
 * The other fields (`booster`, `charger`, `inverter`, `controller`) are
 * carried on the input for future use but are NOT applied today. This is a
 * documented behaviour change from the legacy algorithm — overrides no
 * longer propagate into downstream cable sizing (user rule: "don't edit the
 * algorithm itself"). See plan §4.4 for rationale.
 */

import type { AlgorithmOutput, CustomOverrides } from "./types";

export function applyCustomOverrides(
  output: AlgorithmOutput,
  overrides: CustomOverrides,
): AlgorithmOutput {
  let battery = output.battery;
  let solar = output.solar;

  if (overrides.battery !== null && Number.isFinite(overrides.battery)) {
    battery = { ...battery, recommendedCapacityAh: overrides.battery };
  }
  if (overrides.solar !== null && Number.isFinite(overrides.solar)) {
    // Re-compute shortfall against the unchanged yield so the output stays
    // internally consistent — `battery.dailyWh` is still the target demand.
    const solarShortfallWh = Math.max(
      0,
      battery.dailyWh - solar.dailySolarYieldWh,
    );
    solar = {
      ...solar,
      requiredWp: overrides.solar,
      solarShortfallWh,
    };
  }

  if (battery === output.battery && solar === output.solar) {
    return output;
  }
  return { ...output, battery, solar };
}
