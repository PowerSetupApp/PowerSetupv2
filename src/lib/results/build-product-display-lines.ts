import type { AlgorithmOutput } from "@/lib/algorithm/types";

import type { AISelectionItem, PrefilterResult, RecommendationBucket } from "@/lib/recommendation/types";

const BUCKET_ORDER: RecommendationBucket[] = [
  "battery",
  "solar",
  "inverter",
  "controller",
  "cable",
  "other",
];

export type ResultProductDisplayLine = {
  productId: string;
  contextDe?: string;
  bucket?: RecommendationBucket;
};

function sortAiByBucket(ai: AISelectionItem[]): AISelectionItem[] {
  return [...ai].sort(
    (a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket),
  );
}

function linePresent(lines: ResultProductDisplayLine[], productId: string, contextDe?: string): boolean {
  return lines.some((l) => l.productId === productId && (l.contextDe ?? "") === (contextDe ?? ""));
}

export function solarModuleCountHint(calc: AlgorithmOutput, moduleWp: number): string | undefined {
  if (!calc.solar.needed || moduleWp <= 0) return undefined;
  const req = Math.max(calc.solar.requiredWp, 1);
  const n = Math.ceil(req / moduleWp);
  const total = n * moduleWp;
  return `${n}× à ${moduleWp} Wp = ${total} Wp (Ziel ≥ ${Math.round(req)} Wp)`;
}

function fuseLinesFromPrefilter(pref: PrefilterResult, max: number): ResultProductDisplayLine[] {
  const out: ResultProductDisplayLine[] = [];
  const seen = new Set<string>();
  for (const o of pref.other) {
    if (o.score < 22) continue;
    if (seen.has(o.productId)) continue;
    seen.add(o.productId);
    out.push({ productId: o.productId, contextDe: "Sicherung / Schutz", bucket: "other" });
    if (out.length >= max) break;
  }
  return out;
}

function appendMissingFuses(lines: ResultProductDisplayLine[], prefilter: PrefilterResult): void {
  const ids = new Set(lines.map((l) => l.productId));
  for (const fl of fuseLinesFromPrefilter(prefilter, 4)) {
    if (ids.has(fl.productId)) continue;
    ids.add(fl.productId);
    lines.push(fl);
  }
}

function ensurePortableControllerLine(
  lines: ResultProductDisplayLine[],
  calculations: AlgorithmOutput,
  prefilter: PrefilterResult,
): void {
  if (!calculations.portableController.needed) return;
  const top = prefilter.controllerPortable?.[0];
  if (!top) return;
  if (lines.some((l) => l.productId === top.productId && l.contextDe?.includes("Portable"))) return;
  const newLine: ResultProductDisplayLine = {
    productId: top.productId,
    contextDe: "Laderegler Portable / Taschensolar",
    bucket: "controller",
  };
  const invIdx = lines.findIndex((l) => l.bucket === "inverter");
  if (invIdx !== -1) {
    lines.splice(invIdx + 1, 0, newLine);
    return;
  }
  const ctrlIdx = lines.findIndex((l) => l.bucket === "controller");
  if (ctrlIdx !== -1) {
    lines.splice(ctrlIdx + 1, 0, newLine);
    return;
  }
  lines.push(newLine);
}

/**
 * Geordnete Zeilen für die Ergebnis-UI — mehrere Kabel pro Route, KI + Ergänzungen.
 */
export function buildProductDisplayLines(
  calculations: AlgorithmOutput | null,
  prefilter: PrefilterResult | null,
  aiSelections: AISelectionItem[],
): ResultProductDisplayLine[] {
  if (!calculations || !prefilter) return [];

  const lines: ResultProductDisplayLine[] = [];

  if (aiSelections.length > 0) {
    for (const s of sortAiByBucket(aiSelections)) {
      lines.push({ productId: s.productId, bucket: s.bucket });
    }
    for (const run of prefilter.cableByRoute ?? []) {
      if (linePresent(lines, run.productId, run.displayName)) continue;
      lines.push({
        productId: run.productId,
        contextDe: run.displayName,
        bucket: "cable",
      });
    }
    ensurePortableControllerLine(lines, calculations, prefilter);
    appendMissingFuses(lines, prefilter);
  } else {
    if (prefilter.battery[0]) {
      lines.push({ productId: prefilter.battery[0].productId, bucket: "battery" });
    }
    if (calculations.solar.needed && prefilter.solar[0]) {
      lines.push({ productId: prefilter.solar[0].productId, bucket: "solar" });
    }
    if (calculations.inverter.needed && prefilter.inverter[0]) {
      lines.push({ productId: prefilter.inverter[0].productId, bucket: "inverter" });
    }
    if (calculations.controller.needed && prefilter.controller[0]) {
      lines.push({ productId: prefilter.controller[0].productId, bucket: "controller" });
    }
    ensurePortableControllerLine(lines, calculations, prefilter);
    for (const run of prefilter.cableByRoute ?? []) {
      lines.push({
        productId: run.productId,
        contextDe: run.displayName,
        bucket: "cable",
      });
    }
    appendMissingFuses(lines, prefilter);
  }

  return lines;
}

/**
 * Ergänzt Kontextzeilen (z. B. Solar-Modulanzahl) sobald Katalogfelder geladen sind.
 */
export function enrichDisplayLinesWithCatalogHints(
  lines: ResultProductDisplayLine[],
  calculations: AlgorithmOutput,
  cards: { id: string; solarWp?: number | null }[],
): ResultProductDisplayLine[] {
  const wpById = new Map(cards.map((c) => [c.id, c.solarWp ?? null]));
  return lines.map((line) => {
    if (line.bucket !== "solar" || line.contextDe) return line;
    const wp = wpById.get(line.productId);
    if (wp == null || wp <= 0) return line;
    const hint = solarModuleCountHint(calculations, wp);
    return hint ? { ...line, contextDe: hint } : line;
  });
}
