# Admin dashboard (`/admin`)

Source: [`../old/src/app/admin/page.tsx`](../old/src/app/admin/page.tsx)

The legacy dashboard is **compact** (not a large analytics surface).

## Statistics (Prisma)

1. **Produkte** — `product.count()`; subtitle: count where `isActive === true` (“X aktiv”).
2. **Kategorien** — `category.count()`.
3. **Results (7 Tage)** — `result.count({ where: { createdAt: { gte: now - 7d } } })`.

## Schnellaktionen

- Primary button → `/admin/products/new` (**Neues Produkt**).
- Outline button → `/admin/categories` (**Neue Kategorie**) — navigates to list (not a dedicated `/new` deep link in legacy).

## Note for rewrite

If product requirements mention a “large” dashboard, extend **on top of** this baseline (extra cards, recent results, alerts); the old implementation as copied only exposes the above.
