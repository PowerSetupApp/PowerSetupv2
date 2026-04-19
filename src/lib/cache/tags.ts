/**
 * Zentrale Cache-Tag-Registry für Next.js 16 Cache-Components.
 *
 * Alle `use cache`-Funktionen verwenden Tags aus dieser Datei; alle Admin-
 * Mutationen rufen `updateTag(<TAG>)` nach erfolgreichem Commit auf. Das hält
 * Cache-Invalidation reviewbar an einer Stelle.
 */

export const CACHE_TAGS = {
  /** Wizard Schritt 3 — Verbraucher-Vorlagen. Invalidate bei ConsumerDevice-CRUD. */
  consumerTemplates: "consumer-templates",
  /** Admin-Katalog (Produkte, Kategorien, Brands). Invalidate bei Catalog-CRUD. */
  adminCatalog: "admin-catalog",
  /** Algorithmus-Settings aus DB. Invalidate bei Settings-Save. */
  algorithmSettings: "algorithm-settings",
  /** Produkt-Empfehlungskatalog (isActive=true). Invalidate bei Product-CRUD. */
  activeProducts: "active-products",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
