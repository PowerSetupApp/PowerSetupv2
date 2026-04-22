/**
 * Regeln für Admin-Produktliste: Filter-Werte (PS-7) vs. Algorithmus-Dimensionen (Katalogabdeckung).
 * Pure functions — nutzbar in Queries und Tests.
 */

export function isSolarChargerSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes("solar") || s.includes("mppt") || s.includes("pv") || s.includes("photovoltaik");
}

export function isInverterCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes("inverter") || s.includes("wechselrichter");
}

export function isSolarControllerCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes("solar") || s.includes("mppt") || s.includes("photovoltaik");
}

export function isCableCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes("kabel") || s.includes("cable");
}

/** Shore-/DC-Ladegerät: Charger-Kategorie ohne Solar/MPPT-Slug (analog zu getCatalogComponentDimensionStats). */
export function isDcShoreChargerCategorySlug(slug: string): boolean {
  const s = slug.toLowerCase();
  return s.includes("charger") && !isSolarChargerSlug(s);
}

function filterValuesAsRecord(filterValues: unknown): Record<string, unknown> {
  if (filterValues && typeof filterValues === "object" && !Array.isArray(filterValues)) {
    return filterValues as Record<string, unknown>;
  }
  return {};
}

export function isEmptyFilterValueEntry(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * PS-7: Unvollständig, wenn ein für die Kategorie definierter CategoryFilter-Key (außer `brand`)
 * in `filterValues` fehlt oder leer ist.
 */
export function isIncompleteCategoryFilterValues(
  categoryFilterKeys: readonly string[],
  filterValues: unknown,
): boolean {
  const rec = filterValuesAsRecord(filterValues);
  for (const key of categoryFilterKeys) {
    if (key.toLowerCase() === "brand") continue;
    if (!(key in rec) || isEmptyFilterValueEntry(rec[key])) return true;
  }
  return false;
}

export type AlgorithmSpecFields = {
  categorySlug: string;
  powerW: number | null;
  currentA: number | null;
  crossSectionMm2: number | null;
};

/**
 * Gleiche Slug-/Feldregeln wie die Katalogabdeckung „ohne Spec“ (unabhängig von `isActive`).
 */
export function productMissingAlgorithmDimensionSpec(p: AlgorithmSpecFields): boolean {
  const slug = p.categorySlug;
  if (isInverterCategorySlug(slug) && p.powerW == null) return true;
  if (isSolarControllerCategorySlug(slug) && p.currentA == null) return true;
  if (isCableCategorySlug(slug) && p.crossSectionMm2 == null) return true;
  if (isDcShoreChargerCategorySlug(slug) && p.currentA == null) return true;
  return false;
}
