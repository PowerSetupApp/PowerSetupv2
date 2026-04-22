/**
 * Deterministischer Prefilter: ordnet aktive Katalog-Produkte Buckets zu,
 * bewertet sie gegen `AlgorithmOutput` und kappt pro Kategorie auf `perCategoryLimit`.
 * Ausgabe ist die einzige Produktmenge, die die KI im Prompt sieht (`types.RecommendationPipelineResult`).
 */

import { roundUpToStandardMm2 } from "@/lib/algorithm/cable-standards";
import type { AlgorithmOutput, BatteryPreference, CableRecommendation } from "@/lib/algorithm/types";

import type {
  PrefilterResult,
  ProductRecommendationRow,
  RecommendationBucket,
  ScoredCableRoutePick,
  ScoredProduct,
} from "./types";

export { roundUpToStandardMm2 };

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

export function batteryChemFromRow(row: ProductRecommendationRow): BatteryPreference | null {
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

function isPortableMountHint(row: ProductRecommendationRow): boolean {
  const fv = row.filterValues;
  const mount = fv?.mountType ?? fv?.Montageart;
  if (typeof mount === "string" && mount.toLowerCase().includes("portable")) return true;
  const hay = `${row.categorySlug} ${row.name}`.toLowerCase();
  return /portable|tasche|falt|mobiles?\s+sol/.test(hay);
}

function isFuseLikeRow(row: ProductRecommendationRow): boolean {
  const hay = `${row.categorySlug} ${row.name}`.toLowerCase();
  return /sicher|fuse|anh|anl|midi|meg|pv.?sicher|string.?fuse/.test(hay);
}

function parseFuseRatingFromName(name: string): number | null {
  const m = /(\d+)\s*(?:a|amp)\b/i.exec(name);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function fuseRatingFromRow(row: ProductRecommendationRow): number | null {
  if (row.currentA != null && row.currentA > 0) return row.currentA;
  return parseFuseRatingFromName(row.name);
}

function collectFuseTargets(calc: AlgorithmOutput): number[] {
  const targets: number[] = [];
  const b2f = calc.cables.find((c) => c.route === "battery_to_fuse_box");
  if (b2f && b2f.currentA > 0) targets.push(b2f.currentA);
  if (calc.controller.needed && calc.controller.currentA > 0) targets.push(calc.controller.currentA);
  if (calc.portableController.needed && calc.portableController.currentA > 0) {
    targets.push(calc.portableController.currentA);
  }
  if (calc.inverter.needed && calc.battery.voltage > 0) {
    const invDc = calc.inverter.recommendedW / calc.battery.voltage;
    if (invDc > 0) targets.push(invDc);
  }
  const uniq = [...new Set(targets.map((t) => Math.ceil(t)))].filter((t) => t > 0).sort((a, b) => b - a);
  return uniq.slice(0, 4);
}

function scoreFuseProduct(row: ProductRecommendationRow, targets: number[]): number {
  if (!isFuseLikeRow(row)) return 0;
  const rating = fuseRatingFromRow(row);
  if (rating == null) return 8;
  let best = 0;
  for (const t of targets) {
    if (rating >= t * 0.92) {
      best = Math.max(best, 260 - Math.abs(rating - t) * 1.2 - (rating > t * 2.2 ? 40 : 0));
    }
  }
  return best;
}

function scoreProduct(
  row: ProductRecommendationRow,
  bucket: RecommendationBucket,
  calc: AlgorithmOutput,
  fuseTargets: number[],
): number {
  switch (bucket) {
    case "battery": {
      if (row.capacityAh == null) return -1000;
      const cap = row.capacityAh;
      const target = Math.max(calc.battery.recommendedCapacityAh, 1);
      let score: number;
      if (cap < target * 0.98) {
        score = -900 - (target - cap) * 4;
      } else {
        const overshoot = cap - target;
        score = 620 - Math.min(overshoot, 120) * 0.8 - Math.max(0, overshoot - 120) * 2.5;
      }
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
      if (row.solarWp == null || row.solarWp <= 0) return -200;
      const moduleWp = row.solarWp;
      const req = Math.max(calc.solar.requiredWp, 1);
      const panelsNeeded = Math.ceil(req / moduleWp);
      const arrayWp = panelsNeeded * moduleWp;
      if (arrayWp < req - 1e-6) return -400;
      const maxRoof = calc.solar.maxRoofWp;
      let score = 520 - panelsNeeded * 18 - Math.abs(arrayWp - req) * 0.12;
      if (maxRoof > 0 && !isPortableMountHint(row)) {
        if (arrayWp > maxRoof + 1) score -= (arrayWp - maxRoof) * 1.5;
      }
      if (isPortableMountHint(row) && calc.solar.portableWp > 0) {
        score += 22;
      }
      return score;
    }
    case "inverter": {
      if (!calc.inverter.needed) return -500;
      if (row.powerW == null) return -200;
      let score = 400 - Math.abs(row.powerW - calc.inverter.recommendedW);
      if (row.powerW < calc.inverter.recommendedW * 0.95) score -= 180;
      score += inverterWaveformBonus(row);
      return score;
    }
    case "controller": {
      if (!calc.controller.needed) return -500;
      if (row.currentA == null) return -200;
      let score = 400 - Math.abs(row.currentA - calc.controller.currentA);
      if (row.currentA < calc.controller.currentA * 0.92) score -= 160;
      const kind = controllerKindFromRow(row);
      if (kind != null) {
        if (kind === calc.controller.type) score += 100;
        else score -= 220;
      }
      return score;
    }
    case "cable": {
      if (!calc.cables.length) return 0;
      let sum = 0;
      let n = 0;
      for (const c of calc.cables) {
        if (!isActiveCableRoute(c)) continue;
        if (row.crossSectionMm2 == null) return -150;
        const goal = roundUpToStandardMm2(c.recommendedCrossSection);
        if (goal <= 0) continue;
        const mm = row.crossSectionMm2;
        if (mm < goal * 0.95) continue;
        sum += 240 - (mm - goal) * 10;
        n += 1;
      }
      if (n === 0) return -120;
      return sum / n;
    }
    default:
      return scoreFuseProduct(row, fuseTargets);
  }
}

function isActiveCableRoute(c: CableRecommendation): boolean {
  return c.lengthM > 0 && c.currentA > 0 && c.recommendedCrossSection > 0;
}

function scoreCableForRoute(row: ProductRecommendationRow, c: CableRecommendation): number {
  if (row.crossSectionMm2 == null) return -1000;
  const goal = roundUpToStandardMm2(c.recommendedCrossSection);
  if (goal <= 0) return -1000;
  const mm = row.crossSectionMm2;
  if (mm < goal * 0.95) return -400 - (goal - mm) * 5;
  return 300 - (mm - goal) * 12;
}

function buildCableByRoute(
  calc: AlgorithmOutput,
  cableProducts: ProductRecommendationRow[],
): ScoredCableRoutePick[] {
  const out: ScoredCableRoutePick[] = [];
  for (const c of calc.cables) {
    if (!isActiveCableRoute(c)) continue;
    let best: ScoredCableRoutePick | null = null;
    for (const p of cableProducts) {
      const score = scoreCableForRoute(p, c);
      if (score < -200) continue;
      const pick: ScoredCableRoutePick = {
        route: c.route,
        displayName: c.displayName,
        productId: p.id,
        bucket: "cable",
        score,
        categorySlug: p.categorySlug,
        name: p.name,
      };
      if (!best || pick.score > best.score) best = pick;
    }
    if (best) out.push(best);
  }
  return out;
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
  const fuseTargets = collectFuseTargets(calculations);

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
    const score = scoreProduct(p, bucket, calculations, fuseTargets);
    const item: ScoredProduct = {
      productId: p.id,
      bucket,
      score,
      categorySlug: p.categorySlug,
      name: p.name,
    };
    buckets[bucket].push(item);
  }

  const cableRows = products.filter((p) => detectBucket(p.categorySlug) === "cable");
  const cableByRoute = buildCableByRoute(calculations, cableRows);

  let controllerPortable: ScoredProduct[] | undefined;
  if (calculations.portableController.needed) {
    const portableCalc: AlgorithmOutput = {
      ...calculations,
      controller: calculations.portableController,
    };
    const portRows: ScoredProduct[] = [];
    for (const p of products) {
      if (detectBucket(p.categorySlug) !== "controller") continue;
      const score = scoreProduct(p, "controller", portableCalc, fuseTargets);
      portRows.push({
        productId: p.id,
        bucket: "controller",
        score,
        categorySlug: p.categorySlug,
        name: p.name,
      });
    }
    controllerPortable = sortAndLimit(portRows, perCategoryLimit);
  }

  return {
    battery: sortAndLimit(buckets.battery, perCategoryLimit),
    solar: sortAndLimit(buckets.solar, perCategoryLimit),
    inverter: sortAndLimit(buckets.inverter, perCategoryLimit),
    controller: sortAndLimit(buckets.controller, perCategoryLimit),
    cable: sortAndLimit(buckets.cable, perCategoryLimit),
    other: sortAndLimit(buckets.other, perCategoryLimit),
    cableByRoute: cableByRoute.length ? cableByRoute : undefined,
    controllerPortable,
  };
}
