/**
 * Phase: MPPT controller sizing.
 *
 * Two physical regulators are dimensioned, because roof-mounted panels and
 * portable solar bags have very different electrical profiles (different
 * string characteristics, different duty cycles) and in practice are wired
 * through separate MPPTs (references/solar.md "Sizing the MPPT").
 *
 *   roof-MPPT:      currentA   = maxRoofWp            / systemVoltage
 *                   maxInputWp = maxRoofWp
 *   portable-MPPT:  currentA   = portableWp (nominal) / systemVoltage
 *                   maxInputWp = portableWp (nominal)
 *
 * Nominal (not effective) Wp is used on the portable side: the regulator
 * has to survive the bag's peak in good sun, not the de-rated
 * alignment × utilization value from `sizeSolar`.
 *
 * `needed` is only true when the corresponding physical array exists (roof
 * area > 0 / bags configured) AND solar is selected as an energy source.
 */

import type {
  AlgorithmInput,
  ControllerRecommendation,
  SolarRecommendation,
} from "../types";

export function sizeController(
  solar: SolarRecommendation,
  input: AlgorithmInput,
): ControllerRecommendation {
  const currentA =
    input.systemVoltage > 0 ? solar.maxRoofWp / input.systemVoltage : 0;

  return {
    needed: solar.needed && solar.maxRoofWp > 0,
    type: "mppt",
    currentA,
    maxInputWp: solar.maxRoofWp,
    scope: "roof",
  };
}

export function sizePortableController(
  solar: SolarRecommendation,
  input: AlgorithmInput,
): ControllerRecommendation {
  const currentA =
    input.systemVoltage > 0 ? solar.portableWp / input.systemVoltage : 0;

  return {
    needed: solar.needed && solar.portableWp > 0,
    type: "mppt",
    currentA,
    maxInputWp: solar.portableWp,
    scope: "portable",
  };
}
