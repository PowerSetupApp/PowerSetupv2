import type { ProductRecommendationRow } from "@/lib/recommendation/types";
import type { SchematicProductBrief } from "@/lib/schematic/product-brief";

import { applyAmazonPartnerTag } from "@/lib/affiliate/amazon-partner-url";
import { decimalToNumber } from "@/lib/money";

import { getPrisma } from "../client";
import { readFromDatabase, type DbReadResult } from "../prisma-errors";

function normalizeFilterValues(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

/** Produktkarte für Ergebnis-UI (Affiliate-URL serverseitig angereichert). */
export type ResultProductCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  affiliateUrl: string | null;
  categoryName: string;
  /** Für Solar-Hinweise (Modulanzahl) auf der Ergebnis-Seite. */
  solarWp?: number | null;
};

/**
 * Aktive Produkte mit Kategorie — für Prefilter / KI (Prisma nur hier).
 * `readFromDatabase` unterscheidet sauber zwischen „DB unerreichbar"
 * (→ leeres Katalog-Fallback ist akzeptabel) und fachlichen Fehlern
 * (werfen, damit sie im Log auftauchen).
 */
export async function listActiveProductsForRecommendation(): Promise<
  DbReadResult<ProductRecommendationRow[]>
> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      categorySlug: r.category.slug,
      categoryName: r.category.name,
      capacityAh: r.capacityAh,
      voltageV: r.voltageV,
      solarWp: r.solarWp,
      powerW: r.powerW,
      currentA: r.currentA,
      crossSectionMm2: r.crossSectionMm2,
      batteryType: r.batteryType,
      waveform: r.waveform,
      filterValues: normalizeFilterValues(r.filterValues),
    }));
  });
}

/** Detail-Stammdaten für KI-Schaltplan (Reihenfolge = `ids`). */
export async function listProductsByIdsForSchematic(ids: string[]): Promise<SchematicProductBrief[]> {
  if (!ids.length) return [];
  const prisma = getPrisma();
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { category: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered: SchematicProductBrief[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (!r) continue;
    ordered.push({
      id: r.id,
      name: r.name,
      categoryName: r.category.name,
      specs: r.specs,
      capacityAh: r.capacityAh,
      voltageV: r.voltageV,
      solarWp: r.solarWp,
      powerW: r.powerW,
      currentA: r.currentA,
      crossSectionMm2: r.crossSectionMm2,
      batteryType: r.batteryType,
      waveform: r.waveform,
    });
  }
  return ordered;
}

/** Liefert aktive Produkte für die angegebenen IDs (Reihenfolge = `ids`). */
export async function listProductsByIdsForResult(
  ids: string[],
): Promise<DbReadResult<ResultProductCard[]>> {
  if (!ids.length) return { ok: true, data: [] };
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { category: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered: ResultProductCard[] = [];
    for (const id of ids) {
      const r = byId.get(id);
      if (!r) continue;
      ordered.push({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        price: decimalToNumber(r.price),
        affiliateUrl: applyAmazonPartnerTag(r.affiliateUrl),
        categoryName: r.category.name,
        solarWp: r.solarWp,
      });
    }
    return ordered;
  });
}
