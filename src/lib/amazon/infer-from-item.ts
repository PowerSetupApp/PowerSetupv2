import type { AmazonExtractedProduct } from "@/lib/amazon/extractor";
import type { AmazonItem } from "@/lib/amazon/types";

function parseAmpereFromValue(value: string): number | null {
  const v = value.replace(/\s+/g, " ").trim();
  if (!v) return null;
  if (/\bAmperestunden\b/i.test(v) || /\b(W|Wh|kWh)\b/i.test(v)) return null;
  const m = v.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:Ampere\b|A(?!h)\b)/i);
  if (!m) return null;
  const n = Number.parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

/**
 * BMS / Nenn-Entladestrom steht auf amazon.de oft unter „Stromstärke“ statt „Entladestrom“.
 */
function inferMaxDischargeAFromTechnicalRows(
  rows: Array<{ name?: string; value?: string }>,
): number | null {
  for (const r of rows) {
    const name = (r.name ?? "").trim();
    const value = (r.value ?? "").trim();
    if (!name || !value) continue;
    if (
      /kapaz|amperestunden|gewicht|masse|spannung|volt|dimension|größ|maß|bestseller|asin|bewert|modell|hersteller-?nummer|ean|gtin|mitgelief|garant|ranking|sterne|global trade|identification/i.test(
        name,
      )
    ) {
      continue;
    }
    if (
      /entlad|discharge|strom(stärke)?|dauerstrom|nennstrom|max\.?\s*strom|bms|überstrom/i.test(
        name,
      ) ||
      /^strom$/i.test(name)
    ) {
      const a = parseAmpereFromValue(value);
      if (a != null && a < 5000) return a;
    }
  }
  return null;
}

/**
 * Wenn die KI `maxDischargeA` leer lässt, Wert aus gescrapten Technik-Zeilen ableiten
 * (z. B. „Stromstärke: 140 Ampere“).
 */
export function applyTechnicalDetailNumericInference(
  extracted: AmazonExtractedProduct,
  amazonItem: AmazonItem,
): AmazonExtractedProduct {
  if (extracted.maxDischargeA != null) return extracted;
  const rows = amazonItem.itemInfo?.technicalInfo?.technicalDetails;
  if (!rows?.length) return extracted;
  const inferred = inferMaxDischargeAFromTechnicalRows(rows);
  if (inferred == null) return extracted;
  return { ...extracted, maxDischargeA: inferred };
}
