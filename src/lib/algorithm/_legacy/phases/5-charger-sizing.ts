import type { AlgorithmInput, ChargerRecommendation } from "../types";
import { STANDARD_CURRENT_SIZES } from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { getChargerTimeHours, roundUpToStandard } from "./1-energy-demand";
import { getDoD } from "./2-battery-capacity";
import { getSetting } from "./settings";

/**
 * Dimensioniert das Landstrom-Ladegerät.
 *
 * Neue Formel (ersetzt `batteryAh / chargerTimeHours` ohne Chemie-Korrektur):
 *
 *   targetCurrentA = (batteryAh × DoD × (1 + absorptionOverhead)) / chargerTimeHours
 *
 * - `DoD`: realistisch nutzbare Kapazität (AGM/Gel ≈ 0.5, LiFePO4 ≈ 0.95). Macht
 *   AGM-Ladegerät nicht unnötig groß, weil nur die halbe Kapazität wirklich
 *   nachzuladen ist.
 * - `absorptionOverhead`: Puffer für die Konstantspannungs-Phase (Taper), damit
 *   auch „Absorption → Float“ noch in die Zielzeit passt. Default 0.15 (≈ 15 %).
 */
export function calculateCharger(
  input: AlgorithmInput,
  batteryAh: number,
  trace?: AlgorithmTrace,
): ChargerRecommendation {
  const hasShorePower = input.energySources.includes("shore_power");

  if (!hasShorePower) {
    return {
      needed: false,
      targetCurrentA: 0,
      recommendedCurrentA: 0,
      chargingTimeHours: 0,
    };
  }

  const chargerTimeHours = getChargerTimeHours(input.chargerSpeed, input, trace);
  const dod = getDoD(input.batteryPreference, input, trace);
  const absorptionOverhead = getSetting(
    input,
    "chargerAbsorptionOverhead",
    0.15,
    "charger",
    trace,
  );
  const chargerClasses = input.componentClasses?.charger ?? STANDARD_CURRENT_SIZES;

  const usableAh = batteryAh * dod;
  const targetCurrentA = (usableAh * (1 + absorptionOverhead)) / chargerTimeHours;
  const standardRecommendedCurrentA = roundUpToStandard(targetCurrentA, chargerClasses);

  let effectiveRecommendedCurrentA = standardRecommendedCurrentA;
  if (input.customOverrides.charger !== null) {
    effectiveRecommendedCurrentA = input.customOverrides.charger;
  }

  const actualChargingTimeHours = usableAh / effectiveRecommendedCurrentA;

  pushStep(trace, {
    phase: "charger",
    id: "charger.usableAh",
    label: "Nutzbare Kapazität (nach DoD)",
    value: Math.round(usableAh),
    unit: "Ah",
    kind: "intermediate",
    formula: `${batteryAh} Ah × DoD ${dod}`,
  });
  pushStep(trace, {
    phase: "charger",
    id: "charger.targetCurrentA",
    label: "Ziel-Ladestrom",
    value: Math.round(targetCurrentA * 10) / 10,
    unit: "A",
    kind: "intermediate",
    formula: `(${Math.round(usableAh)} Ah × (1 + ${absorptionOverhead})) / ${chargerTimeHours} h`,
  });
  pushStep(trace, {
    phase: "charger",
    id: "charger.recommendedCurrentA",
    label: "Empfohlener Ladestrom",
    value: effectiveRecommendedCurrentA,
    unit: "A",
    kind: "output",
  });

  return {
    needed: true,
    targetCurrentA: Math.round(targetCurrentA * 10) / 10,
    recommendedCurrentA: effectiveRecommendedCurrentA,
    originalRecommendedCurrentA: standardRecommendedCurrentA,
    chargingTimeHours: Math.round(actualChargingTimeHours * 10) / 10,
  };
}
