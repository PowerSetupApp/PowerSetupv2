/** Ein DB-Produkt, reduziert für Prefilter / KI-Pipeline (kein Prisma-Typ im UI). */
export type ProductRecommendationRow = {
  id: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  capacityAh: number | null;
  voltageV: number | null;
  solarWp: number | null;
  powerW: number | null;
  currentA: number | null;
};

export type RecommendationBucket = "battery" | "solar" | "inverter" | "controller" | "cable" | "other";

export interface ScoredProduct {
  productId: string;
  bucket: RecommendationBucket;
  /** Höher = besser passend (heuristisch). */
  score: number;
  categorySlug: string;
  name: string;
}

export interface PrefilterResult {
  battery: ScoredProduct[];
  solar: ScoredProduct[];
  inverter: ScoredProduct[];
  controller: ScoredProduct[];
  cable: ScoredProduct[];
  other: ScoredProduct[];
}

export interface AISelectionItem {
  productId: string;
  bucket: RecommendationBucket;
  reasonDe: string;
}
