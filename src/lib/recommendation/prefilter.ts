import type { AlgorithmOutput, BatteryPreference } from "@/lib/algorithm/types";

import type { PrefilterResult, ProductRecommendationRow, RecommendationBucket, ScoredProduct } from "./types";

function detectBucket(slug: string): RecommendationBucket {
  const s = slug.toLowerCase();
  if (s.includes("batter") || s.includes("akku")) return "battery";
  if (s.includes("solar") || s.includes("modul") || s.includes("panel")) return "solar";
  if (s.includes("inverter") || s.includes("wechselrichter")) return "inverter";
  if (s.includes("controller") || s.includes("laderegler") || s.includes("mppt") || s.includes("pwm")) {
    return "controller";
  }
  if (s.includes("kabel") || s.includes("cable")) return "cable";
  return "other";
}

/** Mappt Freitext / Admin-`filterValues` auf eine Batterie-Chemie. */
function canonicalBatteryChem(input: string | null | undefined): BatteryPreference | null {
  if (!input || typeof input !== "string") return null;
  const t = input.trim().toLowerCase().replace(/\s+/g, "");
  if (t.includes("lifepo") || t === "lfp" || t.includes("lithium") || t.includes("li-fe")) return "lifepo4";
  if (t.includes("agm")) return "agm";
  if (t.includes("gel")) return "gel";
  return null;
}

function batteryChemFromRow(row: ProductRecommendationRow): BatteryPreference | null {
  const fromCol = canonicalBatteryChem(row.batteryType);
  if (fromCol) return fromCol;
  const fv = row.filterValues;
  if (!fv) return null;
  const keys = ["batteryType", "chemistry", "cell_chemistry", "batterietyp", "Batterietyp", "type"];
  for (const k of keys) {
    const v = fv[k];
    if (typeof v === "string") {
      const c = canonicalBatteryChem(v);
      if (c) return c;
    }
  }
  return null;
}

function controllerKindFromRow(row: ProductRecommendationRow): "mppt" | "pwm" | null {
  const fv = row.filterValues;
  if (fv) {
    const keys = ["controllerType", "regulatorType", "mppt_pwm", "laderegler", "technologie"];
    for (const k of keys) {
      const v = fv[k];
      if (typeof v !== "string") continue;
      const t = v.trim().toLowerCase();
      if (t.includes("mppt")) return "mppt";
      if (t.includes("pwm")) return "pwm";
    }
  }
  const slug = row.categorySlug.toLowerCase();
  const hay = `${slug} ${row.name.toLowerCase()}`;
  if (hay.includes("mppt")) return "mppt";
  if (hay.includes("pwm")) return "pwm";
  return null;
}

function inverterWaveformBonus(row: ProductRecommendationRow): number {
  const fromCol = row.waveform;
  const scan = (s: string | null | undefined): number => {
    if (!s) return 0;
    const t = s.toLowerCase();
    if (t.includes("pure") || (t.includes("sinus") && !t.includes("modified"))) return 40;
    return 0;
  };
  let bonus = scan(fromCol);
  const fv = row.filterValues;
  for (const k of ["waveform", "wellenform", "Wellenform"]) {
    const v = fv?.[k];
    if (typeof v === "string") bonus = Math.max(bonus, scan(v));
  }
  return bonus;
}

function scoreProduct(
  row: ProductRecommendationRow,
  bucket: RecommendationBucket,
  calc: AlgorithmOutput,
): number {
  switch (bucket) {
    case "battery": {
      if (row.capacityAh == null) return -1000;
      const cap = row.capacityAh;
      const target = calc.battery.recommendedCapacityAh;
      let score = 500 - Math.abs(cap - target);
      if (row.voltageV != null && row.voltageV === calc.battery.voltage) score += 50;
      const chem = batteryChemFromRow(row);
      if (chem != null) {
        if (chem === calc.battery.type) score += 120;
        else score -= 320;
      }
      return score;
    }
    case "solar": {
      if (!calc.solar.needed) return -500;
      if (row.solarWp == null) return -200;
      const target = Math.max(calc.solar.requiredWp, 1);
      let score = 400 - Math.abs(row.solarWp - target);
      const fv = row.filterValues;
      const mount = fv?.mountType ?? fv?.Montageart;
      if (typeof mount === "string" && calc.solar.maxRoofWp > 0 && mount.toLowerCase().includes("portable")) {
        if (calc.solar.portableWp > 0) score += 25;
      }
      return score;
    }
    case "inverter": {
      if (!calc.inverter.needed) return -500;
      if (row.powerW == null) return -200;
      let score = 400 - Math.abs(row.powerW - calc.inverter.recommendedW);
      score += inverterWaveformBonus(row);
      return score;
    }
    case "controller": {
      if (!calc.controller.needed) return -500;
      if (row.currentA == null) return -200;
      let score = 400 - Math.abs(row.currentA - calc.controller.currentA);
      const kind = controllerKindFromRow(row);
      if (kind != null) {
        if (kind === calc.controller.type) score += 100;
        else score -= 220;
      }
      return score;
    }
    case "cable": {
      if (!calc.cables.length) return 0;
      const target = Math.max(...calc.cables.map((c) => c.recommendedCrossSection));
      if (row.crossSectionMm2 == null) return -150;
      return 320 - Math.abs(row.crossSectionMm2 - target) * 22;
    }
    default:
      return 0;
  }
}

function sortAndLimit(rows: ScoredProduct[], limit: number): ScoredProduct[] {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function prefilterProductsForRecommendation(params: {
  calculations: AlgorithmOutput;
  products: ProductRecommendationRow[];
  perCategoryLimit: number;
}): PrefilterResult {
  const { calculations, products, perCategoryLimit } = params;

  const buckets: Record<RecommendationBucket, ScoredProduct[]> = {
    battery: [],
    solar: [],
    inverter: [],
    controller: [],
    cable: [],
    other: [],
  };

  for (const p of products) {
    const bucket = detectBucket(p.categorySlug);
    const score = scoreProduct(p, bucket, calculations);
    const item: ScoredProduct = {
      productId: p.id,
      bucket,
      score,
      categorySlug: p.categorySlug,
      name: p.name,
    };
    buckets[bucket].push(item);
  }

  return {
    battery: sortAndLimit(buckets.battery, perCategoryLimit),
    solar: sortAndLimit(buckets.solar, perCategoryLimit),
    inverter: sortAndLimit(buckets.inverter, perCategoryLimit),
    controller: sortAndLimit(buckets.controller, perCategoryLimit),
    cable: sortAndLimit(buckets.cable, perCategoryLimit),
    other: sortAndLimit(buckets.other, perCategoryLimit),
  };
}
