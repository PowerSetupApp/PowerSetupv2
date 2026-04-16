import type { AlgorithmInput, AlgorithmOutput } from "./types";
import {
  applyOverrides,
  calculateBattery,
  calculateBooster,
  calculateCables,
  calculateCharger,
  calculateController,
  calculateDailyConsumption,
  calculateInverter,
  calculateSolar,
  getPSH,
  getSimultaneousFactor,
  getStandingDays,
} from "./phases";

/**
 * Orchestrator: gleiche Reihenfolge wie Legacy `calculate-requirements.ts`.
 * Phasen-Module unter `./phases/` (PS-2).
 */
export function calculateRequirements(input: AlgorithmInput): AlgorithmOutput {
  const psh = getPSH(input.travelBehavior.season, input.travelBehavior.winterLocation, input);
  const simultaneousFactor = getSimultaneousFactor(input.simultaneousLoad, input);
  const standingDays = getStandingDays(input.travelBehavior.standingDuration, input);

  const dailyWh = calculateDailyConsumption(input.consumers, input);
  const solar = calculateSolar(input, dailyWh, psh);
  const booster = calculateBooster(input, standingDays);
  const battery = calculateBattery(
    input,
    dailyWh,
    solar.dailySolarYieldWh,
    booster.dailyAlternatorChargeWh,
    solar.solarShortfallWh,
  );
  const charger = calculateCharger(input, battery.recommendedCapacityAh);
  const inverter = calculateInverter(input, input.consumers, simultaneousFactor);
  const controller = calculateController(input, solar.maxRoofWp);
  const cables = calculateCables(input, booster, charger, inverter, controller);

  let output: AlgorithmOutput = {
    battery,
    solar,
    booster,
    charger,
    inverter,
    controller,
    cables,
  };

  output = applyOverrides(output, input.customOverrides);
  return output;
}

export function calculate(input: AlgorithmInput): AlgorithmOutput {
  return calculateRequirements(input);
}

export default calculateRequirements;

export * from "./phases";
