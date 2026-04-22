import { mergeAlgorithmTuning, type AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";
import { AIInvocationError } from "@/lib/ai/types";

import { listActiveProductsForRecommendation } from "@/lib/db/queries/products";

import { selectProductsWithAI, validateAISelections } from "./ai-selector";
import { enforceAiSelectionsMinima } from "./enforce-ai-selections";
import { prefilterProductsForRecommendation } from "./prefilter";
import type { AISelectionItem, PrefilterResult, ProductRecommendationRow } from "./types";
import { buildSolarWiringRecommendation } from "./wiring/solar-wiring";
import type { SolarWiringRecommendation } from "./wiring/types";

export type { AISelectionItem, PrefilterResult, ProductRecommendationRow } from "./types";
export type { SolarWiringRecommendation, SolarWiringWarning, SolarWiringRationale } from "./wiring/types";
export { readPositiveNumberFilter } from "./wiring/filter-values";
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
  wiring?: SolarWiringRecommendation | null;
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
  /** DB-/Wizard-Overrides (u. a. `vocColdMultiplier`, Kabel-Sicherheitsfaktor). */
  tuningOverrides?: Partial<AlgorithmTuning>;
}): Promise<RecommendationPipelineResult> {
  const tuning = mergeAlgorithmTuning(params.tuningOverrides ?? {});
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
    tuning,
  });

  const wiringFromSelections = (aiSelections: AISelectionItem[] | null) =>
    buildSolarWiringRecommendation({
      calculations: params.calculations,
      prefilter,
      aiSelections,
      products,
      tuning,
    });

  if (!params.runAi) {
    return { prefilter, wiring: wiringFromSelections(null) };
  }

  try {
    const ai = await selectProductsWithAI({
      calculations: params.calculations,
      prefilter,
      products,
      tuning,
    });
    const validated = validateAISelections(ai.selections, prefilter);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const enforced = enforceAiSelectionsMinima({
      selections: validated,
      calculations: params.calculations,
      batteryRanked: prefilter.battery,
      solarRanked: prefilter.solar,
      productsById: productMap,
      tuning,
    });
    return {
      prefilter,
      ai: { ...ai, selections: enforced },
      wiring: wiringFromSelections(enforced),
    };
  } catch (e) {
    if (e instanceof AIInvocationError) {
      console.warn("[runRecommendationPipeline] KI-Auswahl übersprungen:", e.message);
      return { prefilter, wiring: wiringFromSelections(null) };
    }
    throw e;
  }
}
