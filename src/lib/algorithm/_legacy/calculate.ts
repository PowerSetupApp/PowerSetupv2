import type { AlgorithmInput, AlgorithmOutput } from "./types";
import type { AlgorithmTrace } from "./trace";
import { pushStep, pushWarning } from "./trace";
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
 *
 * Optional kann ein `trace` mitgegeben werden. Ist er vorhanden, schreiben die
 * Phasen ihre Zwischenwerte, Konstanten-Provenance und Warnungen in ihn hinein.
 * Ohne Trace bleibt das Verhalten bit-identisch zum alten Algorithmus.
 */
export function calculateRequirements(
  input: AlgorithmInput,
  trace?: AlgorithmTrace,
): AlgorithmOutput {
  pushStep(trace, {
    phase: "input",
    id: "input.systemVoltage",
    label: "Bordspannung",
    value: input.systemVoltage,
    unit: "V",
    kind: "input",
  });
  pushStep(trace, {
    phase: "input",
    id: "input.consumers",
    label: "Verbraucher",
    value: input.consumers.length,
    unit: "Stk",
    kind: "input",
  });
  pushStep(trace, {
    phase: "input",
    id: "input.autarchyDays",
    label: "Autarkie-Ziel",
    value: input.autarchyDays,
    unit: "Tage",
    kind: "input",
  });

  const psh = getPSH(input.travelBehavior.season, input.travelBehavior.winterLocation, input, trace);
  pushStep(trace, {
    phase: "energy",
    id: "energy.psh",
    label: "Peak Sun Hours (PSH)",
    value: psh,
    unit: "h/Tag",
    kind: "intermediate",
    formula: `PSH = sunHours(${input.travelBehavior.season}) × locationFactor(${input.travelBehavior.winterLocation})`,
  });

  const simultaneousFactor = getSimultaneousFactor(input.simultaneousLoad, input, trace);
  pushStep(trace, {
    phase: "energy",
    id: "energy.simultaneousFactor",
    label: "Gleichzeitigkeitsfaktor",
    value: simultaneousFactor,
    kind: "intermediate",
  });

  const standingDays = getStandingDays(input.travelBehavior.standingDuration, input, trace);
  pushStep(trace, {
    phase: "energy",
    id: "energy.standingDays",
    label: "Standtage zwischen Fahrten",
    value: standingDays,
    unit: "Tage",
    kind: "intermediate",
  });

  const dailyWh = calculateDailyConsumption(input.consumers, input, trace);
  pushStep(trace, {
    phase: "energy",
    id: "energy.dailyWh",
    label: "Tagesverbrauch",
    value: Math.round(dailyWh),
    unit: "Wh/Tag",
    kind: "output",
  });

  const solar = calculateSolar(input, dailyWh, psh, trace);
  const booster = calculateBooster(input, standingDays, trace);
  const battery = calculateBattery(
    input,
    dailyWh,
    solar.dailySolarYieldWh,
    booster.dailyAlternatorChargeWh,
    solar.solarShortfallWh,
    trace,
  );
  const charger = calculateCharger(input, battery.recommendedCapacityAh, trace);
  const inverter = calculateInverter(input, input.consumers, simultaneousFactor, trace);
  const controller = calculateController(input, solar.totalAvailableWp, trace);
  const cables = calculateCables(input, booster, charger, inverter, controller, trace);

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

  if (trace) {
    const theoretical = dailyWh > 0 ? dailyWh / (input.systemVoltage * 0.95) : 0;
    if (theoretical > 0 && output.battery.recommendedCapacityAh > theoretical * 4) {
      pushWarning(trace, {
        phase: "battery",
        code: "battery.oversized",
        severity: "warn",
        message: `Empfohlene Batterie (${output.battery.recommendedCapacityAh} Ah) > 4× theoretischem Tagesbedarf (${Math.round(
          theoretical,
        )} Ah) — prüfe Autarkie-Tage & Cloudy-Faktor.`,
      });
    }
    if (
      theoretical > 0 &&
      output.battery.recommendedCapacityAh > 0 &&
      output.battery.recommendedCapacityAh < theoretical
    ) {
      pushWarning(trace, {
        phase: "battery",
        code: "battery.undersized",
        severity: "warn",
        message: `Empfohlene Batterie (${output.battery.recommendedCapacityAh} Ah) liegt unter dem theoretischen Tagesbedarf (${Math.round(
          theoretical,
        )} Ah) — reicht nicht mal für einen bewölkten Tag.`,
      });
    }
    if (output.controller.needed && output.controller.currentA > 120) {
      pushWarning(trace, {
        phase: "controller",
        code: "controller.veryLarge",
        severity: "info",
        message: `MPPT-Regler ≥ 120 A ist unüblich — prüfe Solar-Wp und Bordspannung.`,
      });
    }
    if (output.controller.needed && output.controller.currentA > 0 && output.controller.currentA < 10) {
      pushWarning(trace, {
        phase: "controller",
        code: "controller.verySmall",
        severity: "info",
        message: `Sehr kleiner MPPT-Regler (<10 A) — prüfe, ob die Dachfläche realistisch ist.`,
      });
    }
    if (output.inverter.needed && output.inverter.recommendedW > 6000) {
      pushWarning(trace, {
        phase: "inverter",
        code: "inverter.veryLarge",
        severity: "info",
        message: `Wechselrichter ≥ 6 kW ist für mobile Anwendungen unüblich — prüfe 230-V-Verbraucher.`,
      });
    }
    // Wechselrichter vs. tatsächlich angeschlossene 230-V-Geräte: wenn nichts
    // in der 230-V-Rail ist, braucht es auch keinen Inverter.
    const acLoadW = input.consumers
      .filter((c) => c.voltage === 230)
      .reduce((sum, c) => sum + c.power, 0);
    if (output.inverter.needed && acLoadW === 0 && output.inverter.recommendedW > 0) {
      pushWarning(trace, {
        phase: "inverter",
        code: "inverter.noAcLoad",
        severity: "warn",
        message: `Wechselrichter dimensioniert (${output.inverter.recommendedW} W), aber keine 230-V-Verbraucher konfiguriert.`,
      });
    }
    if (output.inverter.needed && acLoadW > 0 && output.inverter.recommendedW < acLoadW * 0.5) {
      pushWarning(trace, {
        phase: "inverter",
        code: "inverter.tooSmallForAcLoad",
        severity: "warn",
        message: `Wechselrichter (${output.inverter.recommendedW} W) kleiner als halbe summierte 230-V-Last (${acLoadW} W) — prüfe Gleichzeitigkeitsfaktor.`,
      });
    }
  }

  return output;
}

export function calculate(input: AlgorithmInput, trace?: AlgorithmTrace): AlgorithmOutput {
  return calculateRequirements(input, trace);
}

export default calculateRequirements;

export * from "./phases";
