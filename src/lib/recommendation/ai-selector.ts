import * as z from "zod";

import { callAI } from "@/lib/ai/client";
import { buildProductSelectionPrompt } from "@/lib/ai/prompts/product-selection";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

import type { AISelectionItem, PrefilterResult } from "./types";

const bucketSchema = z.enum(["battery", "solar", "inverter", "controller", "cable", "other"]);

const selectionResponseSchema = z.object({
  selections: z.array(
    z.object({
      productId: z.string(),
      bucket: bucketSchema,
      reasonDe: z.string(),
    }),
  ),
});

export function parseProductSelectionJson(text: string): AISelectionItem[] {
  const raw = JSON.parse(text) as unknown;
  const parsed = selectionResponseSchema.parse(raw);
  return parsed.selections;
}

/**
 * AI-Halluzinationen abfangen: Nur Produkt-IDs akzeptieren, die tatsächlich im
 * Prefilter enthalten waren. Unbekannte IDs werden verworfen — das ist
 * sicherer, als sie später in der UI mit „unbekannt" darzustellen oder gar
 * fehlende Produkte zu zeigen.
 */
export function validateAISelections(
  selections: AISelectionItem[],
  prefilter: PrefilterResult,
): AISelectionItem[] {
  const allowed = new Set<string>();
  for (const bucket of Object.values(prefilter)) {
    for (const item of bucket) {
      allowed.add(item.productId);
    }
  }
  return selections.filter((s) => allowed.has(s.productId));
}

export async function selectProductsWithAI(params: {
  calculations: AlgorithmOutput;
  prefilter: PrefilterResult;
}): Promise<{ selections: AISelectionItem[]; model: string; inputTokens: number; outputTokens: number }> {
  const { systemInstruction, userPrompt } = buildProductSelectionPrompt(params);
  const res = await callAI({
    systemInstruction,
    userPrompt,
    responseMimeType: "application/json",
  });
  const selections = parseProductSelectionJson(res.text);
  return {
    selections,
    model: res.model,
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  };
}
