import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type { ResultRowForPage } from "@/lib/db/queries/results";
import type { AISelectionItem, PrefilterResult } from "@/lib/recommendation/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isAlgorithmOutput(v: unknown): v is AlgorithmOutput {
  if (!isRecord(v)) return false;
  return "battery" in v && "solar" in v && isRecord(v.battery) && isRecord(v.solar);
}

function isPrefilterResult(v: unknown): v is PrefilterResult {
  if (!isRecord(v)) return false;
  const keys = ["battery", "solar", "inverter", "controller", "cable", "other"] as const;
  return keys.every((k) => Array.isArray(v[k]));
}

function parseAiSelections(ai: unknown): AISelectionItem[] {
  if (!isRecord(ai)) return [];
  const raw = ai.selections;
  if (!Array.isArray(raw)) return [];
  const out: AISelectionItem[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const productId = item.productId;
    const bucket = item.bucket;
    const reasonDe = item.reasonDe;
    if (typeof productId !== "string" || typeof bucket !== "string" || typeof reasonDe !== "string") {
      continue;
    }
    if (
      bucket !== "battery" &&
      bucket !== "solar" &&
      bucket !== "inverter" &&
      bucket !== "controller" &&
      bucket !== "cable" &&
      bucket !== "other"
    ) {
      continue;
    }
    out.push({ productId, bucket, reasonDe });
  }
  return out;
}

function collectProductIds(prefilter: PrefilterResult | null, ai: AISelectionItem[]): string[] {
  if (ai.length > 0) return [...new Set(ai.map((s) => s.productId))];
  if (!prefilter) return [];
  const keys: (keyof PrefilterResult)[] = ["battery", "solar", "inverter", "controller", "cable", "other"];
  const out: string[] = [];
  for (const k of keys) {
    const top = prefilter[k][0];
    if (top) out.push(top.productId);
  }
  return out;
}

export type ResultViewModel = {
  calculations: AlgorithmOutput | null;
  prefilter: PrefilterResult | null;
  aiSelections: AISelectionItem[];
  productIdsForDisplay: string[];
};

export function parseResultViewModel(row: ResultRowForPage): ResultViewModel {
  const calculations = isAlgorithmOutput(row.calculations) ? row.calculations : null;
  const rec = isRecord(row.recommendations) ? row.recommendations : null;
  const prefilter = rec?.prefilter && isPrefilterResult(rec.prefilter) ? rec.prefilter : null;
  const aiSelections = rec?.ai ? parseAiSelections(rec.ai) : [];
  const productIdsForDisplay = collectProductIds(prefilter, aiSelections);

  return { calculations, prefilter, aiSelections, productIdsForDisplay };
}
