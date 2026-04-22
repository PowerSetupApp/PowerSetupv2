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
  crossSectionMm2: number | null;
  /** Chemie/Typ aus Stammdaten (z. B. lifepo4, agm) — Abgleich mit Algorithmus-Empfehlung. */
  batteryType: string | null;
  /** Wellenform Wechselrichter (z. B. pure_sine) — optional für Prefilter-Bonus. */
  waveform: string | null;
  /** Admin-JSON: CategoryFilter-`key` → ausgewählter Wert (String/Number). */
  filterValues: Record<string, unknown> | null;
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

/** Bestes Kabel pro aktiver Strecke (für Prompt + Ergebnisliste). */
export interface ScoredCableRoutePick {
  route: string;
  displayName: string;
  productId: string;
  bucket: "cable";
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
  /** Optional: pro Leitungspfad ein Treffer (neu persistiert; alte JSON-Zeilen ohne Feld). */
  cableByRoute?: ScoredCableRoutePick[];
  /** Optional: zweiter Laderegler für Taschensolar, falls `portableController.needed`. */
  controllerPortable?: ScoredProduct[];
}

export interface AISelectionItem {
  productId: string;
  bucket: RecommendationBucket;
  reasonDe: string;
}
