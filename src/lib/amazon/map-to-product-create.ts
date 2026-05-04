import type { AmazonExtractedProduct } from "@/lib/amazon/extractor";
import type { AmazonItem } from "@/lib/amazon/types";
import type { AdminCategoryFilterEditorRow } from "@/lib/db/queries/admin-catalog-read";

export type AmazonImportScalars = {
  powerW: number | null;
  capacityAh: number | null;
  voltageV: number | null;
  batteryType: string | null;
  currentA: number | null;
  crossSectionMm2: number | null;
  solarWp: number | null;
  supportedVoltages: number[] | null;
  maxDischargeA: number | null;
  waveform: string | null;
  fuseType: string | null;
};

export type AmazonImportMappedPayload = {
  name: string;
  description: string | null;
  price: number | null;
  specs: string;
  imageUrl: string | null;
  affiliateUrl: string | null;
  asin: string;
  brandId: string | null;
  suggestedBrandName: string | null;
  filterValues: Record<string, unknown>;
  scalars: AmazonImportScalars;
};

function matchBrandId(brandName: string | null, brands: { id: string; name: string }[]): string | null {
  if (!brandName?.trim()) return null;
  const lower = brandName.toLowerCase().trim();
  const exact = brands.find((b) => b.name.toLowerCase() === lower);
  if (exact) return exact.id;
  return (
    brands.find(
      (b) =>
        b.name.toLowerCase().includes(lower) ||
        lower.includes(b.name.toLowerCase()),
    )?.id ?? null
  );
}

function voltsToMultiselect(nums: number[] | null | undefined, options: string[]): string[] | null {
  if (!nums?.length) return null;
  const out: string[] = [];
  for (const n of nums) {
    const label = `${n}V`;
    if (options.includes(label)) out.push(label);
  }
  return out.length ? out : null;
}

function voltageNumberToSelect(v: number | null | undefined, options: string[]): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  const rounded = Math.round(v);
  const candidates = [`${rounded}V`, `${v}V`];
  for (const c of candidates) {
    if (options.includes(c)) return c;
  }
  if (v >= 11 && v <= 15) {
    const hit = options.find((o) => o.startsWith("12"));
    if (hit) return hit;
  }
  if (v >= 22 && v <= 28) {
    const hit = options.find((o) => o.startsWith("24"));
    if (hit) return hit;
  }
  if (v >= 44 && v <= 52) {
    const hit = options.find((o) => o.startsWith("48"));
    if (hit) return hit;
  }
  return null;
}

function batteryTypeToSelect(raw: string | null, options: string[]): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();
  if (t.includes("life") || t.includes("lfp") || t.includes("lithium")) {
    return options.find((o) => /life|lfp|lithium/i.test(o)) ?? null;
  }
  if (t.includes("agm")) return options.find((o) => o.toLowerCase().includes("agm")) ?? null;
  if (t.includes("gel")) return options.find((o) => o.toLowerCase().includes("gel")) ?? null;
  return null;
}

function normalizeBatteryColumn(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();
  if (t.includes("life") || t.includes("lfp") || t.includes("lithium")) return "lifepo4";
  if (t.includes("agm")) return "agm";
  if (t.includes("gel")) return "gel";
  return raw.trim();
}

function valueForFilterKey(
  key: string,
  extracted: AmazonExtractedProduct,
): string | number | boolean | string[] | null | undefined {
  const direct = extracted[key as keyof AmazonExtractedProduct];
  if (typeof direct === "number" || typeof direct === "string" || typeof direct === "boolean") {
    return direct;
  }
  if (Array.isArray(direct)) {
    return direct as string[] | number[];
  }
  if (key === "maxPowerWp") {
    return extracted.solarWp ?? extracted.powerW ?? null;
  }
  if (key === "outputPowerW") {
    return extracted.outputPowerW ?? extracted.powerW ?? null;
  }
  if (key === "peakPowerW") {
    return extracted.peakPowerW ?? null;
  }
  if (key === "maxChargeCurrent" || key === "maxChargeA") {
    return extracted.maxChargeCurrent ?? extracted.maxChargeA ?? extracted.currentA ?? null;
  }
  if (key === "maxAmpere") {
    return extracted.currentA ?? extracted.maxChargeA ?? null;
  }
  return undefined;
}

export function buildRecommendationScalars(extracted: AmazonExtractedProduct): AmazonImportScalars {
  const powerW = extracted.outputPowerW ?? extracted.powerW ?? null;
  const solarWp = extracted.solarWp ?? null;
  const currentA = extracted.currentA ?? extracted.maxChargeCurrent ?? extracted.maxChargeA ?? null;
  const supportedVoltages =
    extracted.supportedVoltages ??
    extracted.inputVolts ??
    extracted.outputVolts ??
    null;
  return {
    powerW,
    capacityAh: extracted.capacityAh ?? null,
    voltageV: extracted.voltageV ?? null,
    batteryType: normalizeBatteryColumn(extracted.batteryType),
    currentA,
    crossSectionMm2: extracted.crossSectionMm2 ?? null,
    solarWp,
    supportedVoltages,
    maxDischargeA: extracted.maxDischargeA ?? null,
    waveform: extracted.waveform ?? null,
    fuseType: extracted.fuseType ?? null,
  };
}

/**
 * Mappt KI-Extraktion + Kategorie-Filter-Definitionen auf `filterValues` und Skalare für Prisma.
 */
export function mapAmazonExtractionToImportPayload(
  extracted: AmazonExtractedProduct,
  amazonItem: AmazonItem,
  filters: AdminCategoryFilterEditorRow[],
  brands: { id: string; name: string }[],
): AmazonImportMappedPayload {
  const brandId = matchBrandId(extracted.brandName, brands);
  const suggestedBrandName = !brandId && extracted.brandName?.trim() ? extracted.brandName.trim() : null;

  const filterValues: Record<string, unknown> = {};

  for (const f of filters) {
    const t = f.type.toLowerCase();
    if (t === "brand") {
      if (brandId) filterValues[f.key] = brandId;
      continue;
    }

    if (t === "number") {
      const v = valueForFilterKey(f.key, extracted);
      if (typeof v === "number" && Number.isFinite(v)) {
        filterValues[f.key] = v;
      } else {
        const ex = extracted[f.key as keyof AmazonExtractedProduct];
        if (typeof ex === "number" && Number.isFinite(ex)) {
          filterValues[f.key] = ex;
        }
      }
      continue;
    }

    if (t === "select") {
      if (f.key === "voltageV" || f.unit === "V") {
        const opt = voltageNumberToSelect(extracted.voltageV, f.options);
        if (opt) filterValues[f.key] = opt;
        continue;
      }
      if (f.key === "batteryType") {
        const opt = batteryTypeToSelect(extracted.batteryType, f.options);
        if (opt) filterValues[f.key] = opt;
        continue;
      }
      const raw = extracted[f.key as keyof AmazonExtractedProduct];
      if (typeof raw === "string" && f.options.includes(raw)) {
        filterValues[f.key] = raw;
      } else if (typeof raw === "string") {
        const hit = f.options.find((o) => o.toLowerCase() === raw.toLowerCase());
        if (hit) filterValues[f.key] = hit;
      }
      continue;
    }

    if (t === "multiselect") {
      if (f.key === "inputVoltage") {
        const arr = voltsToMultiselect(extracted.inputVolts, f.options);
        if (arr) filterValues[f.key] = arr;
        continue;
      }
      if (f.key === "outputVoltage") {
        const arr = voltsToMultiselect(extracted.outputVolts, f.options);
        if (arr) filterValues[f.key] = arr;
        continue;
      }
      if (f.key.toLowerCase().includes("spannung") && f.options.some((o) => /^\d+V$/.test(o))) {
        const arr = voltsToMultiselect(extracted.supportedVoltages, f.options);
        if (arr) filterValues[f.key] = arr;
      }
      continue;
    }

    if (t === "text") {
      if (f.key === "dimensions") {
        const L = extracted.dimensions_length;
        const W = extracted.dimensions_width;
        if (L != null && W != null) {
          filterValues[f.key] = `${Math.round(L)} × ${Math.round(W)} mm`;
        }
        continue;
      }
      if (f.key === "color" && extracted.color) {
        filterValues[f.key] = extracted.color;
        continue;
      }
      const v = valueForFilterKey(f.key, extracted);
      if (typeof v === "string" && v.length) filterValues[f.key] = v;
    }
  }

  const listingPrice = amazonItem.offers?.listings?.[0]?.price?.amount;
  const price =
    extracted.price ??
    (typeof listingPrice === "number" && Number.isFinite(listingPrice) ? listingPrice : null);

  return {
    name: extracted.name.trim() || (amazonItem.itemInfo?.title?.displayValue ?? "Produkt"),
    description: extracted.description,
    price,
    specs: extracted.specs || "",
    imageUrl: amazonItem.images?.primary?.large?.url ?? null,
    affiliateUrl: amazonItem.detailPageUrl ?? null,
    asin: amazonItem.asin,
    brandId,
    suggestedBrandName,
    filterValues,
    scalars: buildRecommendationScalars(extracted),
  };
}
