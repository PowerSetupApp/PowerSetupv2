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

/** Mindest-Score: darunter kein „bester schlechter“-Treffer anzeigen. */
export const PREFILTER_MIN_SCORE: Record<RecommendationBucket, number> = {
  battery: 100,
  solar: 100,
  inverter: 80,
  controller: 80,
  cable: 50,
  other: 22,
};

const CABLE_ROUTE_MIN = 50;

export type ResultProductLine =
  | {
      type: "product";
      productId: string;
      contextDe?: string;
      bucket: RecommendationBucket;
    }
  | {
      type: "unmet";
      bucket: RecommendationBucket;
      messageDe: string;
      contextDe?: string;
    };

function unmetMessage(bucket: RecommendationBucket): string {
  const names: Record<RecommendationBucket, string> = {
    battery: "Batterieprodukt",
    solar: "Solarmodul",
    inverter: "Wechselrichter",
    controller: "Laderegler",
    cable: "Kabelprodukt",
    other: "Sicherung / Zubehör",
  };
  return `Kein passendes ${names[bucket]} im Katalog — Anforderungen nicht erfüllt oder bester Kandidat zu weit weg. Bitte Katalog ergänzen oder Auslegung im Schaltplan prüfen.`;
}

function sortAiByBucket(ai: AISelectionItem[]): AISelectionItem[] {
  return [...ai].sort(
    (a, b) => BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket),
  );
}

function lineProductPresent(
  lines: ResultProductLine[],
  productId: string,
  contextDe?: string,
): boolean {
  return lines.some(
    (l) =>
      l.type === "product" && l.productId === productId && (l.contextDe ?? "") === (contextDe ?? ""),
  );
}

function prefilterScoreFor(
  prefilter: PrefilterResult,
  bucket: RecommendationBucket,
  productId: string,
): number | null {
  if (bucket === "controller") {
    const m = prefilter.controller.find((x) => x.productId === productId);
    if (m) return m.score;
    const p = prefilter.controllerPortable?.find((x) => x.productId === productId);
    return p ? p.score : null;
  }
  const x = prefilter[bucket].find((p) => p.productId === productId);
  return x ? x.score : null;
}

function meetsMin(bucket: RecommendationBucket, score: number, forCableRoute?: boolean): boolean {
  if (forCableRoute) return score >= CABLE_ROUTE_MIN;
  return score >= PREFILTER_MIN_SCORE[bucket];
}

function pushAiOrUnmet(
  lines: ResultProductLine[],
  prefilter: PrefilterResult,
  item: AISelectionItem,
): void {
  const s = prefilterScoreFor(prefilter, item.bucket, item.productId);
  const min = PREFILTER_MIN_SCORE[item.bucket];
  if (s == null || s < min) {
    lines.push({
      type: "unmet",
      bucket: item.bucket,
      messageDe: unmetMessage(item.bucket),
    });
    return;
  }
  lines.push({ type: "product", productId: item.productId, bucket: item.bucket });
}

function fuseLinesFromPrefilter(pref: PrefilterResult, max: number): ResultProductLine[] {
  const out: ResultProductLine[] = [];
  const seen = new Set<string>();
  for (const o of pref.other) {
    if (o.score < PREFILTER_MIN_SCORE.other) continue;
    if (seen.has(o.productId)) continue;
    seen.add(o.productId);
    out.push({
      type: "product",
      productId: o.productId,
      contextDe: "Sicherung / Schutz",
      bucket: "other",
    });
    if (out.length >= max) break;
  }
  return out;
}

function appendMissingFuses(lines: ResultProductLine[], prefilter: PrefilterResult): void {
  const ids = new Set(
    lines.filter((l): l is Extract<ResultProductLine, { type: "product" }> => l.type === "product").map(
      (l) => l.productId,
    ),
  );
  for (const fl of fuseLinesFromPrefilter(prefilter, 4)) {
    if (fl.type !== "product") continue;
    if (ids.has(fl.productId)) continue;
    ids.add(fl.productId);
    lines.push(fl);
  }
}

function ensurePortableControllerLine(
  lines: ResultProductLine[],
  calculations: AlgorithmOutput,
  prefilter: PrefilterResult,
): void {
  if (!calculations.portableController.needed) return;
  const top = prefilter.controllerPortable?.[0];
  if (!top) {
    const block = {
      type: "unmet" as const,
      bucket: "controller" as const,
      messageDe: unmetMessage("controller"),
      contextDe: "Laderegler Portable / Taschensolar",
    };
    if (lines.some((l) => l.type === "unmet" && l.contextDe?.includes("Portable"))) return;
    lines.push(block);
    return;
  }
  if (!meetsMin("controller", top.score)) {
    if (lines.some((l) => l.type === "unmet" && l.contextDe?.includes("Portable"))) return;
    lines.push({
      type: "unmet",
      bucket: "controller",
      messageDe: unmetMessage("controller"),
      contextDe: "Laderegler Portable / Taschensolar",
    });
    return;
  }
  if (
    lines.some(
      (l) =>
        l.type === "product" && l.productId === top.productId && l.contextDe?.includes("Portable"),
    )
  ) {
    return;
  }
  const newLine: ResultProductLine = {
    type: "product",
    productId: top.productId,
    contextDe: "Laderegler Portable / Taschensolar",
    bucket: "controller",
  };
  const invIdx = lines.findIndex((l) => l.type === "product" && l.bucket === "inverter");
  if (invIdx !== -1) {
    lines.splice(invIdx + 1, 0, newLine);
    return;
  }
  const ctrlIdx = lines.findIndex((l) => l.type === "product" && l.bucket === "controller");
  if (ctrlIdx !== -1) {
    lines.splice(ctrlIdx + 1, 0, newLine);
    return;
  }
  lines.push(newLine);
}

/**
 * Geordnete Zeilen für die Ergebnis-UI — KI + Prüfung, oder reiner Prefilter mit Mindest-Scores.
 * `type: "unmet"` ersetzt „bester schlechter“ Treffer.
 */
export function buildProductDisplayLines(
  calculations: AlgorithmOutput | null,
  prefilter: PrefilterResult | null,
  aiSelections: AISelectionItem[],
): ResultProductLine[] {
  if (!calculations || !prefilter) return [];

  const lines: ResultProductLine[] = [];

  if (aiSelections.length > 0) {
    for (const s of sortAiByBucket(aiSelections)) {
      pushAiOrUnmet(lines, prefilter, s);
    }
    for (const run of prefilter.cableByRoute ?? []) {
      if (lineProductPresent(lines, run.productId, run.displayName)) continue;
      if (run.score < CABLE_ROUTE_MIN) {
        lines.push({
          type: "unmet",
          bucket: "cable",
          messageDe: unmetMessage("cable"),
          contextDe: run.displayName,
        });
        continue;
      }
      lines.push({
        type: "product",
        productId: run.productId,
        contextDe: run.displayName,
        bucket: "cable",
      });
    }
    ensurePortableControllerLine(lines, calculations, prefilter);
    appendMissingFuses(lines, prefilter);
  } else {
    {
      const topB = prefilter.battery[0];
      if (!topB || !meetsMin("battery", topB.score)) {
        lines.push({ type: "unmet", bucket: "battery", messageDe: unmetMessage("battery") });
      } else {
        lines.push({ type: "product", productId: topB.productId, bucket: "battery" });
      }
    }

    if (calculations.solar.needed) {
      const topS = prefilter.solar[0];
      if (!topS || !meetsMin("solar", topS.score)) {
        lines.push({ type: "unmet", bucket: "solar", messageDe: unmetMessage("solar") });
      } else {
        lines.push({ type: "product", productId: topS.productId, bucket: "solar" });
      }
    }

    if (calculations.inverter.needed) {
      const topI = prefilter.inverter[0];
      if (!topI || !meetsMin("inverter", topI.score)) {
        lines.push({ type: "unmet", bucket: "inverter", messageDe: unmetMessage("inverter") });
      } else {
        lines.push({ type: "product", productId: topI.productId, bucket: "inverter" });
      }
    }

    if (calculations.controller.needed) {
      const topC = prefilter.controller[0];
      if (!topC || !meetsMin("controller", topC.score)) {
        lines.push({ type: "unmet", bucket: "controller", messageDe: unmetMessage("controller") });
      } else {
        lines.push({ type: "product", productId: topC.productId, bucket: "controller" });
      }
    }

    ensurePortableControllerLine(lines, calculations, prefilter);

    for (const run of prefilter.cableByRoute ?? []) {
      if (run.score < CABLE_ROUTE_MIN) {
        lines.push({
          type: "unmet",
          bucket: "cable",
          messageDe: unmetMessage("cable"),
          contextDe: run.displayName,
        });
        continue;
      }
      lines.push({
        type: "product",
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
  lines: ResultProductLine[],
  calculations: AlgorithmOutput,
  cards: { id: string; solarWp?: number | null }[],
): ResultProductLine[] {
  const wpById = new Map(cards.map((c) => [c.id, c.solarWp ?? null]));
  return lines.map((line) => {
    if (line.type !== "product" || line.bucket !== "solar" || line.contextDe) return line;
    const wp = wpById.get(line.productId);
    if (wp == null || wp <= 0) return line;
    const hint = solarModuleCountHint(calculations, wp);
    return hint ? { ...line, contextDe: hint } : line;
  });
}

export function solarModuleCountHint(calc: AlgorithmOutput, moduleWp: number): string | undefined {
  if (!calc.solar.needed || moduleWp <= 0) return undefined;
  const req = Math.max(calc.solar.requiredWp, 1);
  const n = Math.ceil(req / moduleWp);
  const total = n * moduleWp;
  return `${n}× à ${moduleWp} Wp = ${total} Wp (Ziel ≥ ${Math.round(req)} Wp)`;
}

/** @deprecated use ResultProductLine */
export type ResultProductDisplayLine = ResultProductLine;
