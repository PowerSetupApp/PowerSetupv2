import type { AlgorithmInput, BoosterRecommendation } from "../types";
import {
  ALTERNATOR_DRIVE_HOURS,
  BOOSTER_EFFICIENCY,
  DEFAULT_BOOSTER_AMPS,
  ENHANCED_ALTERNATOR_INPUT_AMPS,
} from "../constants";
import type { AlgorithmTrace } from "../trace";
import { pushStep } from "../trace";
import { getSetting } from "./settings";

/**
 * Dimensioniert den Ladebooster (B2B).
 *
 * Wichtige Änderung gegenüber der früheren Version: der tägliche Alternator-
 * Energieeintrag wird jetzt nicht mehr durch `standingDays` geteilt (das hätte
 * langes Stehen *zwingend* in mehr Batterie übersetzt — sachlich falsch, weil
 * auch an Standtagen nichts nachgeladen werden muss, sondern eben nur die
 * Batterie genutzt wird).
 *
 * Stattdessen liefern wir:
 *  - `dailyAlternatorChargeWh`: Energie pro *Kalendertag*, über den Fahr-Zyklus
 *    amortisiert (`driveHours * outputA * V / (standingDays + 1)` — d. h.
 *    jeden `standingDays + 1` Tag wird einmal gefahren).
 *
 * So fließt in die Batterie-Phase ein fairer Durchschnitt pro Kalendertag ein.
 */
export function calculateBooster(
  input: AlgorithmInput,
  standingDays: number,
  trace?: AlgorithmTrace,
): BoosterRecommendation {
  const hasAlternator = input.energySources.includes("alternator");

  if (!hasAlternator) {
    return {
      needed: false,
      inputCurrentA: 0,
      outputCurrentA: 0,
      currentA: 0,
      inputVoltage: input.vehicleVoltage,
      outputVoltage: input.systemVoltage,
      needsConversion: false,
      dailyAlternatorChargeWh: 0,
    };
  }

  const tier = input.alternatorTier ?? "standard";
  const defaultAmps =
    tier === "enhanced"
      ? getSetting(input, "alternatorEnhanced", ENHANCED_ALTERNATOR_INPUT_AMPS, "booster", trace)
      : getSetting(input, "alternatorStandard", DEFAULT_BOOSTER_AMPS, "booster", trace);
  const boosterEff = getSetting(input, "boosterEfficiency", BOOSTER_EFFICIENCY, "booster", trace);
  const driveHours = getSetting(
    input,
    "alternatorDriveHours",
    ALTERNATOR_DRIVE_HOURS,
    "booster",
    trace,
  );

  const standardInputCurrentA = defaultAmps;
  const standardOutputCurrentA =
    (input.vehicleVoltage * standardInputCurrentA * boosterEff) / input.systemVoltage;

  let effectiveInputCurrentA = standardInputCurrentA;
  let effectiveOutputCurrentA = standardOutputCurrentA;

  if (input.customOverrides.booster !== null) {
    effectiveOutputCurrentA = input.customOverrides.booster;
    effectiveInputCurrentA =
      (input.systemVoltage * effectiveOutputCurrentA) / (input.vehicleVoltage * boosterEff);
  }

  const energyPerDriveDayWh =
    effectiveOutputCurrentA * input.systemVoltage * driveHours;
  // Amortisiere über Fahr-Zyklus: 1 Fahrtag auf `standingDays` Standtage, also
  // durchschnittlich alle `standingDays + 1` Kalendertage einmal fahren.
  const cycleDays = Math.max(1, standingDays + 1);
  const dailyAlternatorChargeWh = energyPerDriveDayWh / cycleDays;

  pushStep(trace, {
    phase: "booster",
    id: "booster.outputA",
    label: "Booster Output",
    value: Math.round(effectiveOutputCurrentA),
    unit: "A",
    kind: "intermediate",
    formula: `(${input.vehicleVoltage} V × ${standardInputCurrentA} A × η ${boosterEff}) / ${input.systemVoltage} V`,
  });
  pushStep(trace, {
    phase: "booster",
    id: "booster.driveDayWh",
    label: "Energie pro Fahrtag",
    value: Math.round(energyPerDriveDayWh),
    unit: "Wh/Fahrtag",
    kind: "intermediate",
    formula: `${Math.round(effectiveOutputCurrentA)} A × ${input.systemVoltage} V × ${driveHours} h`,
  });
  pushStep(trace, {
    phase: "booster",
    id: "booster.dailyWh",
    label: "Energie pro Kalendertag (amortisiert)",
    value: Math.round(dailyAlternatorChargeWh),
    unit: "Wh/Tag",
    kind: "output",
    formula: `Wh/Fahrtag / (${standingDays} + 1) = ${Math.round(
      energyPerDriveDayWh,
    )} / ${cycleDays}`,
  });

  return {
    needed: true,
    inputCurrentA: effectiveInputCurrentA,
    outputCurrentA: effectiveOutputCurrentA,
    currentA: effectiveOutputCurrentA,
    originalCurrentA: standardOutputCurrentA,
    inputVoltage: input.vehicleVoltage,
    outputVoltage: input.systemVoltage,
    needsConversion: input.vehicleVoltage !== input.systemVoltage,
    dailyAlternatorChargeWh: Math.round(dailyAlternatorChargeWh),
  };
}
