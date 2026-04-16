import type { ProductRecommendationRow } from "@/lib/recommendation/types";

import { getPrisma } from "../client";

/**
 * Aktive Produkte mit Kategorie — für Prefilter / KI (Prisma nur hier).
 * Ohne DB oder bei Fehler: leeres Array (Wizard/CI bleiben nutzbar).
 */
export async function listActiveProductsForRecommendation(): Promise<ProductRecommendationRow[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
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
    }));
  } catch {
    return [];
  }
}
