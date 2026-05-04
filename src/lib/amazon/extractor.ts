import * as z from "zod";

import { callAI } from "@/lib/ai/client";
import type { AmazonItem } from "@/lib/amazon/types";

const looseNumber = z
  .union([z.number(), z.string()])
  .nullable()
  .optional()
  .transform((v) => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number.parseFloat(v.replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  });

const looseIntArray = z
  .union([z.array(z.number()), z.string()])
  .nullable()
  .optional()
  .transform((v): number[] | null => {
    if (v == null) return null;
    if (Array.isArray(v)) return v.filter((x) => typeof x === "number" && Number.isFinite(x)) as number[];
    return null;
  });

/** Modell-Ausgabe (Felder optional — KI lässt oft Keys weg). */
export const amazonExtractedProductSchema = z
  .object({
    name: z.string(),
    description: z.string().nullable().optional(),
    price: looseNumber,
    brandName: z.string().nullable().optional(),
    powerW: looseNumber,
    capacityAh: looseNumber,
    voltageV: looseNumber,
    batteryType: z.string().nullable().optional(),
    currentA: looseNumber,
    crossSectionMm2: looseNumber,
    solarWp: looseNumber,
    supportedVoltages: looseIntArray,
    maxDischargeA: looseNumber,
    maxChargeA: looseNumber,
    waveform: z.string().nullable().optional(),
    fuseType: z.string().nullable().optional(),
    triggerType: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    dimensions_length: looseNumber,
    dimensions_width: looseNumber,
    weight: looseNumber,
    specs: z.string().optional(),
    cellType: z.string().nullable().optional(),
    constructionType: z.string().nullable().optional(),
    maxInputVoltageV: looseNumber,
    hasBluetooth: z.boolean().nullable().optional(),
    outputPowerW: looseNumber,
    peakPowerW: looseNumber,
    maxChargeCurrent: looseNumber,
    inputVolts: looseIntArray,
    outputVolts: looseIntArray,
  });

export type AmazonExtractedProduct = {
  name: string;
  description: string | null;
  price: number | null;
  brandName: string | null;
  powerW: number | null;
  capacityAh: number | null;
  voltageV: number | null;
  batteryType: string | null;
  currentA: number | null;
  crossSectionMm2: number | null;
  solarWp: number | null;
  supportedVoltages: number[] | null;
  maxDischargeA: number | null;
  maxChargeA: number | null;
  waveform: string | null;
  fuseType: string | null;
  triggerType: string | null;
  color: string | null;
  dimensions_length: number | null;
  dimensions_width: number | null;
  weight: number | null;
  specs: string;
  cellType: string | null;
  constructionType: string | null;
  maxInputVoltageV: number | null;
  hasBluetooth: boolean | null;
  outputPowerW: number | null;
  peakPowerW: number | null;
  maxChargeCurrent: number | null;
  inputVolts: number[] | null;
  outputVolts: number[] | null;
};

function normalizeExtracted(raw: z.infer<typeof amazonExtractedProductSchema>): AmazonExtractedProduct {
  const n = (v: number | null | undefined): number | null =>
    v != null && Number.isFinite(v) && v >= 0 ? v : null;
  return {
    name: raw.name,
    description: raw.description ?? null,
    price: n(raw.price),
    brandName: raw.brandName ?? null,
    powerW: n(raw.powerW),
    capacityAh: n(raw.capacityAh),
    voltageV: n(raw.voltageV),
    batteryType: raw.batteryType ?? null,
    currentA: n(raw.currentA),
    crossSectionMm2: n(raw.crossSectionMm2),
    solarWp: n(raw.solarWp),
    supportedVoltages: raw.supportedVoltages,
    maxDischargeA: n(raw.maxDischargeA),
    maxChargeA: n(raw.maxChargeA),
    waveform: raw.waveform ?? null,
    fuseType: raw.fuseType ?? null,
    triggerType: raw.triggerType ?? null,
    color: raw.color ?? null,
    dimensions_length: n(raw.dimensions_length),
    dimensions_width: n(raw.dimensions_width),
    weight: n(raw.weight),
    specs: raw.specs ?? "",
    cellType: raw.cellType ?? null,
    constructionType: raw.constructionType ?? null,
    maxInputVoltageV: n(raw.maxInputVoltageV),
    hasBluetooth: raw.hasBluetooth ?? null,
    outputPowerW: n(raw.outputPowerW),
    peakPowerW: n(raw.peakPowerW),
    maxChargeCurrent: n(raw.maxChargeCurrent),
    inputVolts: raw.inputVolts,
    outputVolts: raw.outputVolts,
  };
}

const CATEGORY_EXTRACTION_RULES: Record<string, string> = {
  batterien: `
Focus on extracting:
- capacityAh: Battery capacity in Ah (e.g., "100Ah" -> 100)
- voltageV: Nominal voltage (e.g., "12.8V" -> 12, "25.6V" -> 24)
- batteryType: One of "lifepo4", "agm", "gel" (look for "LiFePO4", "Lithium", "AGM", "GEL")
- maxDischargeA: Maximum continuous **discharge** current (BMS limit) in Amps. On Amazon.de the table often says "Stromstärke" or "Entladestrom" (not to confuse with "Batteriekapazität" in Ah).
- maxChargeA: Maximum charge current in Amps (e.g., "50A Ladestrom" -> 50)
- dimensions_length, dimensions_width in mm
- weight in kg
`,
  wechselrichter: `
Focus on extracting:
- powerW: Continuous power in Watts (e.g., "2000W Dauerleistung" -> 2000)
- peakPowerW: Peak/Surge power in Watts
- voltageV: Input voltage (e.g., "12V DC" -> 12)
- waveform: "pure_sine" if "reiner Sinus" or "Pure Sine", else "modified_sine"
`,
  "solar-laderegler": `
Focus on extracting:
- currentA: Maximum charging current in Amps
- maxInputVoltageV: Max. PV input voltage (VoC) in Volts
- supportedVoltages: Array of supported voltages [12, 24, 48]
- hasBluetooth: true if built-in Bluetooth/Smart capability
`,
  ladebooster: `
Focus on extracting:
- maxChargeCurrent: Maximum charging current in Amps
- inputVolts: Input voltages e.g. [12, 24]
- outputVolts: Output voltages e.g. [12, 24]
`,
  batterieladegeraete: `
Focus on extracting:
- currentA: Charging current in Amps
- maxChargeA: if distinct from currentA
- supportedVoltages: Supported voltages as numbers
`,
  solarmodule: `
Focus on extracting:
- solarWp: Peak power in Watts (Wp)
- voltageV: Open circuit voltage if stated
- dimensions_length, dimensions_width in mm
- weight in kg
- cellType, constructionType ("Starr" vs "Flexibel")
`,
  solartaschen: `
Focus on extracting:
- solarWp or max power in Wp
- voltageV if stated
`,
  kabel: `
Focus on extracting:
- crossSectionMm2: Cable cross-section (e.g., "25mm²" -> 25)
- color: "Rot" or "Schwarz" when obvious
`,
  sicherungen: `
Focus on extracting:
- currentA: Fuse rating in Amps (or use maxChargeA if clearer)
- fuseType: exact type string when possible
- triggerType: "Thermisch" or "Magnetisch"
`,
};

function buildExtractionPrompt(amazonItem: AmazonItem, categorySlug: string): string {
  const categoryRules = CATEGORY_EXTRACTION_RULES[categorySlug] ?? "";
  const itemJson = JSON.stringify(amazonItem, null, 2);
  const scrapeExtra = amazonItem.scrapeContextText?.trim()
    ? `\n## Extra text scraped from the product page (use for numbers and specs when JSON fields are sparse)\n${amazonItem.scrapeContextText.trim().slice(0, 10000)}\n`
    : "";

  return `You are a technical product data extractor for camper/boat electrical equipment.

## Task
Extract structured data from the following Amazon product JSON.

## Target Category
The user has selected "${categorySlug}" as the product category.

${categoryRules ? `## Category-Specific Rules\n${categoryRules}` : ""}
${scrapeExtra}

## Extraction Guidelines
1. **name**: Clean product title (remove excessive keywords, keep brand + model + key specs)
2. **description**: First 2-3 feature bullet points combined, max 200 chars
3. **price**: Numeric EUR only
4. **brandName**: Manufacturer/Brand name
5. **voltageV**: Normalize to 12, 24, or 48 when clearly nominal (e.g. 12.8V LiFePO4 -> 12)
6. **supportedVoltages**, **inputVolts**, **outputVolts**: arrays of integers only
7. **dimensions_***: millimeters (mm)
8. **weight**: kilograms (kg)
9. **specs**: Short Markdown bullet list for display

## Output
Return ONLY one JSON object (no markdown fences) with exactly these keys:
name, description, price, brandName, powerW, capacityAh, voltageV, batteryType, currentA, crossSectionMm2, solarWp, supportedVoltages, maxDischargeA, maxChargeA, waveform, fuseType, triggerType, color, dimensions_length, dimensions_width, weight, specs, cellType, constructionType, maxInputVoltageV, hasBluetooth, outputPowerW, peakPowerW, maxChargeCurrent, inputVolts, outputVolts

Use null for unknown numeric/string fields. Use [] only when explicitly empty arrays are intended; otherwise null.

## Amazon Product Data
\`\`\`json
${itemJson}
\`\`\`
`;
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return t;
}

/**
 * KI-Extraktion aus {@link AmazonItem} — nutzt zentrales `callAI` (Admin-KI + Fallback).
 */
export async function extractAmazonProductForCategory(
  amazonItem: AmazonItem,
  categorySlug: string,
): Promise<AmazonExtractedProduct> {
  const userPrompt = buildExtractionPrompt(amazonItem, categorySlug);
  const result = await callAI({
    systemInstruction:
      "You output only valid JSON objects. No commentary. All keys must be present as specified in the user message.",
    userPrompt,
    responseMimeType: "application/json",
  });

  const raw = stripJsonFences(result.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("KI-Antwort war kein gültiges JSON.");
  }

  const out = amazonExtractedProductSchema.safeParse(parsed);
  if (!out.success) {
    throw new Error("KI-Extraktion entspricht nicht dem erwarteten Schema.");
  }

  const data = normalizeExtracted(out.data);
  const listingPrice = amazonItem.offers?.listings?.[0]?.price?.amount;
  const price =
    data.price ??
    (typeof listingPrice === "number" && Number.isFinite(listingPrice) ? listingPrice : null);

  return { ...data, price };
}
