import { callAI } from "@/lib/ai/client";
import { AIInvocationError } from "@/lib/ai/types";
import { buildProductSelectionPrompt } from "@/lib/ai/prompts/product-selection";
import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";
import { getAISettings } from "@/lib/db/queries/admin-settings-ai";

import type { AISelectionItem, PrefilterResult, ProductRecommendationRow, RecommendationBucket } from "./types";

/** Admin-Prompt „Antwortformat“ mit `productGroups` / deutschsprachigen Keys. */
function mapProductGroupKeyToBucket(key: string): RecommendationBucket {
  const k = key.toLowerCase().replace(/_/g, "-").trim();
  const direct: Record<string, RecommendationBucket> = {
    batterie: "battery",
    battery: "battery",
    akku: "battery",
    "solar-laderegler": "controller",
    solaregler: "controller",
    laderegler: "controller",
    solarmodule: "solar",
    solar: "solar",
    module: "solar",
    ladebooster: "other",
    booster: "other",
    b2b: "other",
    ladegeraet: "other",
    landstrom: "other",
    wechselrichter: "inverter",
    inverter: "inverter",
    kabel: "cable",
    cable: "cable",
    sonstiges: "other",
    sicherung: "other",
    sicherungen: "other",
  };
  if (direct[k]) return direct[k];
  if (/batter|akku|speicher/.test(k)) return "battery";
  if (/wechselrichter|inverter/.test(k)) return "inverter";
  if (/solarmodul|pv.?modul|solar.?modul/.test(k)) return "solar";
  if (/laderegler|mppt|pwm|solar.?regler/.test(k)) return "controller";
  if (/kabel|cable|mm²|mm2/.test(k)) return "cable";
  if (/booster|b2b|lichtmaschine|alternator/.test(k)) return "other";
  if (/ladeger|landstrom|shore|netz/.test(k)) return "other";
  return "other";
}

type DecoratedProductRow = Record<string, unknown> & { bucket: unknown };

function flattenProductGroups(productGroups: unknown): unknown[] {
  if (!productGroups || typeof productGroups !== "object" || Array.isArray(productGroups)) {
    return [];
  }
  const groups = productGroups as Record<string, unknown>;
  const out: unknown[] = [];
  for (const [groupKey, rows] of Object.entries(groups)) {
    if (!Array.isArray(rows)) continue;
    const bucket = mapProductGroupKeyToBucket(groupKey);
    const decorated = rows.map((row): DecoratedProductRow | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      return { ...r, bucket: r.bucket ?? r.category ?? bucket };
    });
    const sorted = decorated
      .filter((x): x is DecoratedProductRow => x !== null)
      .sort((a, b) => {
        const ar = a.isRecommended === true ? 0 : 1;
        const br = b.isRecommended === true ? 0 : 1;
        return ar - br;
      });
    out.push(...sorted);
  }
  return out;
}

/** Entfernt typische Markdown-Umhüllung („```json … ```“). */
function stripModelMarkdownFences(text: string): string {
  const t = text.trim();
  const block = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/im.exec(t);
  if (block) return block[1].trim();
  const inline = /```(?:json)?\s*([\s\S]*?)```/.exec(t);
  if (inline) return inline[1].trim();
  return t;
}

/**
 * JSON aus Modelltext — Modelle ignorieren oft „nur JSON“ oder packen Markdown drumherum.
 */
function parseJsonLenient(modelText: string): unknown {
  const cleaned = stripModelMarkdownFences(modelText);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new SyntaxError("Kein auswertbares JSON in der KI-Antwort");
  }
}

function extractSelectionsArray(root: unknown): unknown[] {
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== "object") {
    throw new Error("KI-Antwort: erwartet Objekt oder Array");
  }
  const o = root as Record<string, unknown>;
  const direct =
    o.selections ?? o.selection ?? o.products ?? o.recommendations ?? o.items ?? o.choices;
  if (Array.isArray(direct) && direct.length > 0) return direct;

  const fromGroups = flattenProductGroups(o.productGroups);
  if (fromGroups.length > 0) return fromGroups;

  if (Array.isArray(direct)) return direct;

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    const inner = d.selections ?? d.selection ?? d.products ?? d.items;
    if (Array.isArray(inner) && inner.length > 0) return inner;
    const innerGroups = flattenProductGroups(d.productGroups);
    if (innerGroups.length > 0) return innerGroups;
    if (Array.isArray(inner)) return inner;
  }
  throw new Error('KI-Antwort: Array „selections“ / „selection“ / „productGroups“ fehlt oder hat falsches Format');
}

function normalizeBucket(raw: unknown): RecommendationBucket {
  const canonical = ["battery", "solar", "inverter", "controller", "cable", "other"] as const;
  if (typeof raw !== "string") return "other";
  const v = raw.toLowerCase().trim();
  if ((canonical as readonly string[]).includes(v)) return v as RecommendationBucket;

  const n = v.normalize("NFKD");
  if (/batter|akku|lifepo|speicher/.test(n)) return "battery";
  if (/solar|photovolta|pv\b|modul|panel/.test(n)) return "solar";
  if (/wechselrichter|inverter|umrichter/.test(n)) return "inverter";
  if (/regler|mppt|pwm|laderegler/.test(n)) return "controller";
  if (/kabel|cable|mm²|mm2|querschnitt/.test(n)) return "cable";
  return "other";
}

function coerceSelectionRow(row: unknown): AISelectionItem | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const pid = r.productId ?? r.product_id ?? r.id;
  let productId = "";
  if (typeof pid === "string") productId = pid.trim();
  else if (typeof pid === "number" && Number.isFinite(pid)) productId = String(pid);
  if (!productId) return null;

  const reasonRaw = r.reasonDe ?? r.reason ?? r.reason_de ?? r.grund ?? r.comment ?? "";
  const reasonDe =
    typeof reasonRaw === "string"
      ? reasonRaw.trim()
      : reasonRaw === null || reasonRaw === undefined
        ? ""
        : String(reasonRaw);

  const bucket = normalizeBucket(r.bucket ?? r.category ?? r.type);

  return { productId, bucket, reasonDe };
}

/**
 * Parst die KI-Antwort zur Produktauswahl. Tolerant gegenüber Markdown,
 * alternativen Feldnamen und freiem Bucket-Text (wird auf unsere Enum gemappt).
 */
export function parseProductSelectionJson(text: string): AISelectionItem[] {
  const raw = parseJsonLenient(text);
  const rows = extractSelectionsArray(raw);
  return rows.map(coerceSelectionRow).filter((x): x is AISelectionItem => x !== null);
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
  const baseBuckets = ["battery", "solar", "inverter", "controller", "cable", "other"] as const;
  for (const k of baseBuckets) {
    for (const item of prefilter[k]) {
      allowed.add(item.productId);
    }
  }
  if (prefilter.cableByRoute) {
    for (const c of prefilter.cableByRoute) {
      allowed.add(c.productId);
    }
  }
  if (prefilter.controllerPortable) {
    for (const c of prefilter.controllerPortable) {
      allowed.add(c.productId);
    }
  }
  return selections.filter((s) => allowed.has(s.productId));
}

export async function selectProductsWithAI(params: {
  calculations: AlgorithmOutput;
  prefilter: PrefilterResult;
  /** Vollständiger Katalog für Admin-Platzhalter `{{PRODUCT_CONTEXT}}` und Batterie-Spezzeilen. */
  products?: ProductRecommendationRow[];
  tuning?: Pick<AlgorithmTuning, "inverterEfficiency">;
}): Promise<{ selections: AISelectionItem[]; model: string; inputTokens: number; outputTokens: number }> {
  const aiSettings = await getAISettings();
  const { systemInstruction, userPrompt } = buildProductSelectionPrompt({
    calculations: params.calculations,
    prefilter: params.prefilter,
    products: params.products,
    tuning: params.tuning,
    userPromptTemplate: aiSettings.userPromptTemplate,
    systemPromptOverride: aiSettings.systemPrompt,
  });
  const res = await callAI(
    {
      systemInstruction,
      userPrompt,
      responseMimeType: "application/json",
    },
    aiSettings,
  );
  let selections: AISelectionItem[];
  try {
    selections = parseProductSelectionJson(res.text);
  } catch (e) {
    throw new AIInvocationError(
      "Die KI-Antwort konnte nicht als Produktauswahl gelesen werden. Bitte erneut versuchen.",
      e,
    );
  }
  return {
    selections,
    model: res.model,
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
  };
}
