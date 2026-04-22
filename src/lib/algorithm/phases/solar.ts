/**
 * Phase: solar sizing — mirror of `_size_solar` in
 * `docs/reference/algorithm/camper_electrics_sizing.py`, with portable-bag
 * effective Wp (alignment × utilization).
 *
 * Formulas (references/solar.md + inputs.md C.2):
 *   roofWp              = sum(l*w/10000 * WP_PER_M2[type] * ROOF_PACKING_FACTOR)
 *   portableWp          = sum(bag.power)  (nominal, echoed for UI)
 *   portableEffectiveWp = portableWp × uplift(loc, season) × SOLAR_BAG_UTILIZATION
 *   totalWp             = roofWp + portableEffectiveWp
 *   requiredWp          = dailyWh / (psh * SOLAR_SYSTEM_EFFICIENCY)
 *   dailyYieldWh        = totalWp * psh * SOLAR_SYSTEM_EFFICIENCY
 *   shortfallWh         = max(0, dailyWh - dailyYieldWh)
 */

import type { AlgorithmTuning } from "../algorithm-tuning";
import { roofWp as roofWpHelper } from "../derive";
import type { AlgorithmInput, SolarRecommendation } from "../types";

export function sizeSolar(
  dailyWh: number,
  psh: number,
  input: AlgorithmInput,
  tuning: AlgorithmTuning,
): SolarRecommendation {
  const maxRoofWp = roofWpHelper(input.roofAreas, input.roofModuleType, tuning);
  const portableWp = input.solarBags.reduce((sum, b) => sum + b.power, 0);
  const { winterLocation, season } = input.travelBehavior;
  const bagMultiplier =
    tuning.solarBagAlignmentUplift[winterLocation][season] * tuning.solarBagUtilization;
  const portableEffectiveWp = portableWp * bagMultiplier;
  const totalAvailableWp = maxRoofWp + portableEffectiveWp;

  const denom = psh * tuning.solarSystemEfficiency;
  const requiredWp = denom > 0 ? dailyWh / denom : 0;
  const dailySolarYieldWh = totalAvailableWp * psh * tuning.solarSystemEfficiency;
  const solarShortfallWh = Math.max(0, dailyWh - dailySolarYieldWh);

  return {
    needed: input.energySources.includes("solar"),
    requiredWp,
    maxRoofWp,
    portableWp,
    portableEffectiveWp,
    totalAvailableWp,
    dailySolarYieldWh,
    solarShortfallWh,
    // Legacy-compat stub per inputs.md C.2 note.
    recommendation: "",
  };
}
