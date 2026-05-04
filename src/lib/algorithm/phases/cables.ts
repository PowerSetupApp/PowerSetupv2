/**
 * Phase: cable sizing — based on `docs/reference/algorithm/...` SECTION F, plus
 * Strombelastbarkeit: `min = max(ΔU_min, A_ampacity)` per
 * `mobile-home-electrics-basics/references/cables.md` (voltage drop *and* ampacity).
 *
 * For each route, resolve (L, I, U) per the route table in inputs.md B.5, then:
 *   dUMaxV         = U * (1 % critical / 3 % standard)
 *   aVoltage      = 2 * L * I * ρ / dUMaxV   (mm²)
 *   aAmpacity     = min standard mm² for I * cableCurrentSafetyFactor, with ambient derating on table ampacity
 *   minCrossSection = max(aVoltage, aAmpacity)
 *   recommendedCrossSection = next standard trade size ≥ min
 *
 * If L = 0 or I = 0, `minCrossSection = 0` (route unused / empty). The entry
 * is still emitted so the output shape is stable (always 7 cables in the
 * `ROUTES` order).
 */

import { ambientTempDerateFactor, minStandardMm2ForDesignCurrentA } from "../cable-ampacity";
import { roundUpToStandardMm2 } from "../cable-standards";
import { ROUTES, SOLAR_CABLE_PORTABLE_MM2, SOLAR_CABLE_ROOF_MM2 } from "../constants";
import type { AlgorithmTuning } from "../algorithm-tuning";
import type {
  AlgorithmInput,
  BoosterRecommendation,
  CableRecommendation,
  ChargerRecommendation,
  ControllerRecommendation,
  InverterRecommendation,
  SolarRecommendation,
} from "../types";

/** Resolve (lengthM, currentA, voltage) for a single route. */
function resolveRoute(
  routeId: string,
  input: AlgorithmInput,
  booster: BoosterRecommendation,
  charger: ChargerRecommendation,
  inverter: InverterRecommendation,
  controller: ControllerRecommendation,
  portableController: ControllerRecommendation,
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
    case "regulator_to_service":
      return {
        lengthM: cl.regulatorToService,
        currentA: controller.currentA,
        voltage: input.systemVoltage,
      };
    case "battery_to_fuse_box":
      return {
        lengthM: cl.batteryToFuseBox,
        // Nur DC-Verteiler-Last: der Wechselrichterzug sitzt separat (service_to_inverter).
        currentA:
          input.systemVoltage > 0 ? peakDcW / input.systemVoltage : 0,
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
  portableController: ControllerRecommendation,
  peakDcW: number,
  solar: SolarRecommendation,
  tuning: AlgorithmTuning,
): CableRecommendation[] {
  // Inverter-DC-Strang (Batterie → Wechselrichter); nur für `service_to_inverter`.
  const iInvDc =
    inverter.recommendedW > 0 && input.systemVoltage > 0
      ? inverter.recommendedW / (input.systemVoltage * tuning.inverterEfficiency)
      : 0;

  return ROUTES.map(([routeId, displayName, isCritical]) => {
    if (routeId === "solar_to_regulator") {
      const cl = input.cableLengths;
      const lengthM = cl.solarToRegulator;
      const currentA =
        solar.maxRoofWp > 0
          ? controller.currentA
          : solar.portableWp > 0
            ? portableController.currentA
            : 0;
      const voltage = input.systemVoltage;
      let fixedMm2 = 0;
      if (lengthM > 0 && currentA > 0) {
        if (solar.maxRoofWp > 0) fixedMm2 = SOLAR_CABLE_ROOF_MM2;
        else if (solar.portableWp > 0) fixedMm2 = SOLAR_CABLE_PORTABLE_MM2;
      }
      if (fixedMm2 > 0) {
        const rec = roundUpToStandardMm2(fixedMm2);
        return {
          route: routeId,
          displayName,
          lengthM,
          currentA,
          voltage,
          minCrossSection: fixedMm2,
          recommendedCrossSection: rec,
          isCritical,
          sizingMethod: "fixed-solar" as const,
        };
      }
      return {
        route: routeId,
        displayName,
        lengthM,
        currentA: 0,
        voltage,
        minCrossSection: 0,
        recommendedCrossSection: 0,
        isCritical,
      };
    }

    const { lengthM, currentA, voltage } = resolveRoute(
      routeId,
      input,
      booster,
      charger,
      inverter,
      controller,
      portableController,
      peakDcW,
      iInvDc,
    );
    const duMaxPct = isCritical
      ? tuning.voltageDropCritical
      : tuning.voltageDropNormal;
    const duMaxV = (voltage * duMaxPct) / 100;

    const designA = currentA * tuning.cableCurrentSafetyFactor;
    const ampacityDerate = ambientTempDerateFactor(tuning.ambientTempC);
    const aAmp =
      currentA > 0
        ? minStandardMm2ForDesignCurrentA(
            designA,
            tuning.cableAmpacityInstallMode,
            ampacityDerate,
          )
        : 0;

    let aVoltage = 0;
    if (lengthM > 0 && currentA > 0 && duMaxV > 0) {
      aVoltage = (2 * lengthM * currentA * tuning.copperResistivity) / duMaxV;
    }

    let minCrossSection = 0;
    if (currentA > 0) {
      if (lengthM > 0 && duMaxV > 0) {
        minCrossSection = Math.max(aVoltage, aAmp);
      } else {
        // Length or drop budget unusable: still need thermal minimum.
        minCrossSection = aAmp;
      }
    }

    return {
      route: routeId,
      displayName,
      lengthM,
      currentA,
      voltage,
      minCrossSection,
      recommendedCrossSection: roundUpToStandardMm2(minCrossSection),
      isCritical,
      sizingMethod: "voltage-drop" as const,
    };
  });
}
