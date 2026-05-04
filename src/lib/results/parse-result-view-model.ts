import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type { ResultRowForPage } from "@/lib/db/queries/results";
import type { AISelectionItem, PrefilterResult } from "@/lib/recommendation/types";
import type { SolarWiringRecommendation } from "@/lib/recommendation/wiring/types";

import { buildProductDisplayLines, type ResultProductLine } from "./build-product-display-lines";

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
  if (!keys.every((k) => Array.isArray(v[k]))) return false;
  if ("cableByRoute" in v && v.cableByRoute != null && !Array.isArray(v.cableByRoute)) return false;
  if ("controllerPortable" in v && v.controllerPortable != null && !Array.isArray(v.controllerPortable)) {
    return false;
  }
  return true;
}

function isSolarWiringRecommendation(v: unknown): v is SolarWiringRecommendation {
  if (!isRecord(v)) return false;
  return (
    typeof v.seriesCount === "number" &&
    typeof v.parallelCount === "number" &&
    typeof v.description === "string" &&
    Array.isArray(v.warnings)
  );
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
    if (typeof productId !== "string" || typeof bucket !== "string") {
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
    const reasonRaw = item.reasonDe ?? item.reason;
    const reasonDe = typeof reasonRaw === "string" ? reasonRaw.trim() : "";
    out.push({ productId, bucket, reasonDe });
  }
  return out;
}

/** Eindeutige Produkt-IDs für Schaltplan/PDF (ohne doppelte Kabel-SKUs). */
function uniqueProductIds(lines: ResultProductLine[]): string[] {
  return [
    ...new Set(
      lines
        .filter((l): l is Extract<ResultProductLine, { type: "product" }> => l.type === "product")
        .map((l) => l.productId),
    ),
  ];
}

export type ResultViewModel = {
  calculations: AlgorithmOutput | null;
  prefilter: PrefilterResult | null;
  aiSelections: AISelectionItem[];
  /** Reihenfolge inkl. mehrfacher IDs (z. B. mehrere Kabel-Strecken). */
  productDisplayLines: ResultProductLine[];
  /** Eindeutige IDs für Schaltplan/PDF. */
  productIdsForDisplay: string[];
  /** PV-Reihe/Parallel + MPPT-Check (optional, ab Generierung mit Wiring-Feld). */
  solarWiring: SolarWiringRecommendation | null;
};

export function parseResultViewModel(row: ResultRowForPage): ResultViewModel {
  const calculations = isAlgorithmOutput(row.calculations) ? row.calculations : null;
  const rec = isRecord(row.recommendations) ? row.recommendations : null;
  const prefilter = rec?.prefilter && isPrefilterResult(rec.prefilter) ? rec.prefilter : null;
  const aiSelections = rec?.ai ? parseAiSelections(rec.ai) : [];
  const productDisplayLines = buildProductDisplayLines(calculations, prefilter, aiSelections);
  const productIdsForDisplay = uniqueProductIds(productDisplayLines);
  const wiringRaw = rec?.wiring;
  const solarWiring =
    wiringRaw != null && isSolarWiringRecommendation(wiringRaw) ? wiringRaw : null;

  return {
    calculations,
    prefilter,
    aiSelections,
    productDisplayLines,
    productIdsForDisplay,
    solarWiring,
  };
}
