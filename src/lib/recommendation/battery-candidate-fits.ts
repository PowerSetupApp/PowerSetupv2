import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { bmsDischargeAFromRow, productNominalSystemVoltageV } from "./battery-product-spec";
import { requiredInverterDischargeA } from "./bms-inverter";
import { batteryChemFromRow } from "./prefilter";
import type { ProductRecommendationRow } from "./types";

/**
 * Erfüllt der Akku Nennspannung, Mindest-Ah, Chemie und (falls bekannt) BMS vs. Wechselrichter-I_dc?
 * Unbekannte Nennspannung im Katalog: nicht als Mismatch werten.
 */
export function batteryRowFits(
  row: ProductRecommendationRow,
  calc: AlgorithmOutput,
  tuning: Pick<AlgorithmTuning, "inverterEfficiency">,
  targetAh: number,
): boolean {
  if (row.capacityAh == null || row.capacityAh < targetAh * 0.98) return false;
  const chem = batteryChemFromRow(row);
  if (chem != null && chem !== calc.battery.type) return false;
  const vNom = productNominalSystemVoltageV(row);
  if (vNom != null && vNom !== calc.battery.voltage) return false;
  const needA = requiredInverterDischargeA(calc, tuning);
  if (calc.inverter.needed && needA > 0) {
    const bmsA = bmsDischargeAFromRow(row);
    if (bmsA != null && bmsA < needA * 0.98) return false;
  }
  return true;
}
