/**
 * Phase: cable sizing — 1:1 mirror of `_size_cable` + the ROUTES loop in
 * `docs/reference/algorithm/camper_electrics_sizing.py` (SECTION F).
 *
 * For each route, resolve (L, I, U) per the route table in inputs.md B.5,
 * then:
 *   dUMaxV         = U * (1 % critical / 3 % standard)
 *   minCrossSection = 2 * L * I * COPPER_RHO / dUMaxV   [mm²]
 *
 * If L = 0 or I = 0, `minCrossSection = 0` (route unused / empty). The entry
 * is still emitted so the output shape is stable (always 7 cables in the
 * `ROUTES` order).
 */

import {
  COPPER_RHO,
  CRITICAL_DU_MAX_PCT,
  INVERTER_EFFICIENCY,
  ROUTES,
  STANDARD_DU_MAX_PCT,
} from "../constants";
import type {
  AlgorithmInput,
  BoosterRecommendation,
  CableRecommendation,
  ChargerRecommendation,
  ControllerRecommendation,
  InverterRecommendation,
} from "../types";

/** Resolve (lengthM, currentA, voltage) for a single route. */
function resolveRoute(
  routeId: string,
  input: AlgorithmInput,
  booster: BoosterRecommendation,
  charger: ChargerRecommendation,
  inverter: InverterRecommendation,
  controller: ControllerRecommendation,
  peakDcW: number,
  iInvDc: number,
): { lengthM: number; currentA: number; voltage: number } {
  const cl = input.cableLengths;
  switch (routeId) {
    case "starter_to_booster":
      return {
        lengthM: cl.starterToService,
        currentA: booster.inputCurrentA,
        voltage: input.vehicleVoltage,
      };
    case "booster_to_service":
      return {
        lengthM: cl.boosterToService,
        currentA: booster.outputCurrentA,
        voltage: input.systemVoltage,
      };
    case "charger_to_service":
      return {
        lengthM: cl.chargerToService,
        currentA: charger.recommendedCurrentA,
        voltage: input.systemVoltage,
      };
    case "service_to_inverter":
      return {
        lengthM: cl.serviceToInverter,
        currentA: iInvDc,
        voltage: input.systemVoltage,
      };
    case "solar_to_regulator":
      return {
        lengthM: cl.solarToRegulator,
        currentA: controller.currentA,
        voltage: input.systemVoltage,
      };
    case "regulator_to_service":
      return {
        lengthM: cl.regulatorToService,
        currentA: controller.currentA,
        voltage: input.systemVoltage,
      };
    case "battery_to_fuse_box":
      return {
        lengthM: cl.batteryToFuseBox,
        // DC distribution peak + the inverter's DC draw.
        currentA:
          input.systemVoltage > 0
            ? peakDcW / input.systemVoltage + iInvDc
            : 0,
        voltage: input.systemVoltage,
      };
    default:
      // ROUTES is closed — this should be unreachable.
      throw new Error(`unknown route_id: ${JSON.stringify(routeId)}`);
  }
}

/** Build the full 7-entry cables array in `ROUTES` order. */
export function sizeCables(
  input: AlgorithmInput,
  booster: BoosterRecommendation,
  charger: ChargerRecommendation,
  inverter: InverterRecommendation,
  controller: ControllerRecommendation,
  peakDcW: number,
): CableRecommendation[] {
  // Hoist the inverter's DC-input current once — it is used for both
  // `service_to_inverter` and as a component of `battery_to_fuse_box`.
  const iInvDc =
    inverter.recommendedW > 0 && input.systemVoltage > 0
      ? inverter.recommendedW / (input.systemVoltage * INVERTER_EFFICIENCY)
      : 0;

  return ROUTES.map(([routeId, displayName, isCritical]) => {
    const { lengthM, currentA, voltage } = resolveRoute(
      routeId,
      input,
      booster,
      charger,
      inverter,
      controller,
      peakDcW,
      iInvDc,
    );
    const duMaxPct = isCritical ? CRITICAL_DU_MAX_PCT : STANDARD_DU_MAX_PCT;
    const duMaxV = (voltage * duMaxPct) / 100;

    let minCrossSection = 0;
    if (lengthM > 0 && currentA > 0 && duMaxV > 0) {
      // Voltage-drop-limited minimum (references/cables.md core formula).
      minCrossSection = (2 * lengthM * currentA * COPPER_RHO) / duMaxV;
    }

    return {
      route: routeId,
      displayName,
      lengthM,
      currentA,
      voltage,
      minCrossSection,
      // Legacy-compat: spec C.7 says recommended == min until the type is trimmed.
      recommendedCrossSection: minCrossSection,
      isCritical,
    };
  });
}
