import type { AlgorithmOutput } from "@/lib/algorithm/types";
import { AIInvocationError } from "@/lib/ai/types";

import { listActiveProductsForRecommendation } from "@/lib/db/queries/products";

import { selectProductsWithAI, validateAISelections } from "./ai-selector";
import { enforceAiSelectionsMinima } from "./enforce-ai-selections";
import { prefilterProductsForRecommendation } from "./prefilter";
import type { AISelectionItem, PrefilterResult, ProductRecommendationRow } from "./types";

export type { AISelectionItem, PrefilterResult, ProductRecommendationRow } from "./types";
export { prefilterProductsForRecommendation } from "./prefilter";
export { selectProductsWithAI, parseProductSelectionJson } from "./ai-selector";

export interface RecommendationPipelineResult {
  prefilter: PrefilterResult;
  ai?: {
    selections: AISelectionItem[];
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Empfehlungs-Pipeline (wie im Legacy-Projekt):
 *
 * 1. **Prefilter** — deterministisch aus Katalog + `AlgorithmOutput`: pro Kategorie
 *    (Bucket) werden passende Produkte bewertet und auf eine kleine Top-Liste begrenzt
 *    (`prefilterProductsForRecommendation`).
 * 2. **KI (optional)** — erhält nur diese vorgefilterten Kandidaten im Prompt und wählt
 *    daraus sinnvolle `productId`s; pro Eintrag eine kurze Begründung (`reasonDe`).
 *    Halluzinierte IDs werden verworfen (`validateAISelections`).
 * 3. **Fallback** — wenn die KI nicht erreichbar ist oder die Antwort nicht nutzbar ist,
 *    wird nur der Prefilter gespeichert. Die Ergebnis-Seite zeigt dann die besten
 *    Prefilter-Treffer inkl. Kabel pro Strecke ohne KI-Text (`parse-result-view-model` /
 *    `buildProductDisplayLines`).
 *
 * Persistenz: `POST /api/generate/[id]` → `runGenerateForResultId` → diese Funktion.
 */
export async function runRecommendationPipeline(params: {
  calculations: AlgorithmOutput;
  /** Für Tests injizierbar; Standard: DB. */
  productsOverride?: ProductRecommendationRow[];
  runAi: boolean;
  perCategoryLimit?: number;
}): Promise<RecommendationPipelineResult> {
  let products: ProductRecommendationRow[];
  if (params.productsOverride) {
    products = params.productsOverride;
  } else {
    const dbResult = await listActiveProductsForRecommendation();
    products = dbResult.ok ? dbResult.data : [];
  }
  const prefilter = prefilterProductsForRecommendation({
    calculations: params.calculations,
    products,
    perCategoryLimit: params.perCategoryLimit ?? 6,
  });

  if (!params.runAi) {
    return { prefilter };
  }

  try {
    const ai = await selectProductsWithAI({
      calculations: params.calculations,
      prefilter,
      products,
    });
    const validated = validateAISelections(ai.selections, prefilter);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const enforced = enforceAiSelectionsMinima({
      selections: validated,
      calculations: params.calculations,
      batteryRanked: prefilter.battery,
      solarRanked: prefilter.solar,
      productsById: productMap,
    });
    return {
      prefilter,
      ai: { ...ai, selections: enforced },
    };
  } catch (e) {
    if (e instanceof AIInvocationError) {
      console.warn("[runRecommendationPipeline] KI-Auswahl übersprungen:", e.message);
      return { prefilter };
    }
    throw e;
  }
}
