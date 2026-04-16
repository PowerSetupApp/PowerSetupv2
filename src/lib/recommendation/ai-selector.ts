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
