import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";

/**
 * DC-Entladestrom auf der Batterie für den Wechselrichterpfad.
 * `inverter.recommendedW` enthält bereits den Admin-/Wizard-Peakfaktor (Gleichzeitigkeit).
 * I_dc = P / (U_sys · η_inv) — vgl. mobile-home-electrics `references/inverter.md`.
 */
export function requiredInverterDischargeA(
  calc: AlgorithmOutput,
  tuning: Pick<AlgorithmTuning, "inverterEfficiency">,
): number {
  if (!calc.inverter.needed || calc.battery.voltage <= 0) return 0;
  return calc.inverter.recommendedW / (calc.battery.voltage * tuning.inverterEfficiency);
}
