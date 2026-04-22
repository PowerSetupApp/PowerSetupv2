import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { batteryRowFits } from "./battery-candidate-fits";
import type { AISelectionItem, ProductRecommendationRow } from "./types";

/**
 * Ersetzt offensichtlich unpassende KI-Wahlen für Batterie/Solar
 * durch den besten Prefilter-Kandidaten, der Mindestanforderung, Nennspannung
 * und (falls bekannt) BMS vs. I_dc erfüllt.
 */
export function enforceAiSelectionsMinima(params: {
  selections: AISelectionItem[];
  calculations: AlgorithmOutput;
  /** Prefilter-Reihenfolge: besser = weiter vorne */
  batteryRanked: { productId: string }[];
  solarRanked: { productId: string }[];
  productsById: Map<string, ProductRecommendationRow>;
  tuning: Pick<AlgorithmTuning, "inverterEfficiency">;
}): AISelectionItem[] {
  const { selections, calculations, batteryRanked, solarRanked, productsById, tuning } = params;
  const targetAh = calculations.battery.recommendedCapacityAh;
  const targetWp = Math.max(calculations.solar.requiredWp, 1);

  const out = selections.map((s) => ({ ...s }));

  const batIdx = out.findIndex((s) => s.bucket === "battery");
  if (batIdx >= 0) {
    const row = productsById.get(out[batIdx]!.productId);
    if (row && !batteryRowFits(row, calculations, tuning, targetAh)) {
      const replacement = batteryRanked.find((c) => {
        const p = productsById.get(c.productId);
        return p ? batteryRowFits(p, calculations, tuning, targetAh) : false;
      });
      if (replacement) {
        out[batIdx] = {
          ...out[batIdx]!,
          productId: replacement.productId,
          reasonDe:
            out[batIdx]!.reasonDe.trim() ||
            "Automatisch auf passende Nennspannung, Mindestkapazität und (falls bekannt) BMS-Strom angepasst.",
        };
      }
    }
  }

  if (calculations.solar.needed) {
    const solIdx = out.findIndex((s) => s.bucket === "solar");
    if (solIdx >= 0) {
      const row = productsById.get(out[solIdx]!.productId);
      const modWp = row?.solarWp ?? null;
      if (row && modWp != null && modWp > 0) {
        const panels = Math.ceil(targetWp / modWp);
        const arrayWp = panels * modWp;
        if (arrayWp < targetWp - 1e-6) {
          const replacement = solarRanked.find((c) => {
            const p = productsById.get(c.productId);
            if (!p || p.solarWp == null || p.solarWp <= 0) return false;
            const n = Math.ceil(targetWp / p.solarWp);
            return n * p.solarWp >= targetWp - 1e-6;
          });
          if (replacement) {
            out[solIdx] = {
              ...out[solIdx]!,
              productId: replacement.productId,
              reasonDe:
                out[solIdx]!.reasonDe.trim() ||
                "Automatisch auf ausreichende Gesamtleistung (Modulanzahl × Wp) angepasst.",
            };
          }
        }
      }
    }
  }

  return out;
}
