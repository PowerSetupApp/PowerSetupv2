import type { AlgorithmOutput } from "@/lib/algorithm/types";

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
      return score;
    }
    case "solar": {
      if (!calc.solar.needed) return -500;
      if (row.solarWp == null) return -200;
      const target = Math.max(calc.solar.requiredWp, 1);
      return 400 - Math.abs(row.solarWp - target);
    }
    case "inverter": {
      if (!calc.inverter.needed) return -500;
      if (row.powerW == null) return -200;
      return 400 - Math.abs(row.powerW - calc.inverter.recommendedW);
    }
    case "controller": {
      if (!calc.controller.needed) return -500;
      if (row.currentA == null) return -200;
      return 400 - Math.abs(row.currentA - calc.controller.currentA);
    }
    case "cable": {
      return 0;
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
