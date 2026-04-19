/**
 * Phase: inverter sizing — 1:1 mirror of `_size_inverter` in
 * `docs/reference/algorithm/camper_electrics_sizing.py`.
 *
 * Formula (references/inverter.md + inputs.md C.5):
 *   recommendedW = peakAcW * peakFactor   (raw, no rounding)
 *   needed       = peakAcW > 0
 */

import type { InverterRecommendation } from "../types";

export function sizeInverter(
  peakAcW: number,
  peakFactor: number,
): InverterRecommendation {
  if (peakAcW > 0) {
    return {
      needed: true,
      peakLoadW: peakAcW,
      recommendedW: peakAcW * peakFactor,
    };
  }
  return {
    needed: false,
    peakLoadW: 0,
    recommendedW: 0,
  };
}
