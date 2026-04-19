import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { listActiveProductsForRecommendation } from "@/lib/db/queries/products";

import { selectProductsWithAI, validateAISelections } from "./ai-selector";
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
 * Phase 4 — reine Bibliothek: Prefilter aus DB-Produkten, optional KI-Auswahl.
 * Speichern in `Result` erfolgt später in `POST /api/generate/[id]` (Phase 5).
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

  const ai = await selectProductsWithAI({ calculations: params.calculations, prefilter });
  const validated = validateAISelections(ai.selections, prefilter);
  return {
    prefilter,
    ai: { ...ai, selections: validated },
  };
}
