import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { batteryChemFromRow } from "./prefilter";
import type { AISelectionItem, ProductRecommendationRow } from "./types";

/**
 * Ersetzt offensichtlich unterdimensionierte KI-Wahlen für Batterie/Solar
 * durch den besten Prefilter-Kandidaten, der die Mindestanforderung erfüllt.
 */
export function enforceAiSelectionsMinima(params: {
  selections: AISelectionItem[];
  calculations: AlgorithmOutput;
  /** Prefilter-Reihenfolge: besser = weiter vorne */
  batteryRanked: { productId: string }[];
  solarRanked: { productId: string }[];
  productsById: Map<string, ProductRecommendationRow>;
}): AISelectionItem[] {
  const { selections, calculations, batteryRanked, solarRanked, productsById } = params;
  const targetAh = calculations.battery.recommendedCapacityAh;
  const targetWp = Math.max(calculations.solar.requiredWp, 1);

  const out = selections.map((s) => ({ ...s }));

  const batIdx = out.findIndex((s) => s.bucket === "battery");
  if (batIdx >= 0) {
    const row = productsById.get(out[batIdx]!.productId);
    const cap = row?.capacityAh ?? null;
    const chem = row ? batteryChemFromRow(row) : null;
    const chemOk = chem === null || chem === calculations.battery.type;
    if (row && cap != null && cap < targetAh * 0.98 && chemOk) {
      const replacement = batteryRanked.find((c) => {
        const p = productsById.get(c.productId);
        if (!p || p.capacityAh == null) return false;
        const pchem = batteryChemFromRow(p);
        if (pchem != null && pchem !== calculations.battery.type) return false;
        return p.capacityAh >= targetAh * 0.98;
      });
      if (replacement) {
        out[batIdx] = {
          ...out[batIdx]!,
          productId: replacement.productId,
          reasonDe:
            out[batIdx]!.reasonDe.trim() ||
            "Automatisch auf Mindestkapazität laut Berechnung angepasst.",
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
