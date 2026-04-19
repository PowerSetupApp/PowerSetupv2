# Admin — product categories

Source: [`../old/src/app/admin/categories/page.tsx`](../old/src/app/admin/categories/page.tsx), [`[id]/page.tsx`](../old/src/app/admin/categories/[id]/page.tsx), `new/page.tsx`.

## Liste (`/admin/categories`)

- **Header:** „Kategorien“, Untertitel „N Kategorien“; Button **+ Neue Kategorie** → `/admin/categories/new`.
- **Layout:** responsives **Karten-Raster** (1/2/3 Spalten); jede Karte: Icon, **Name**, Zeile **Slug:** `<slug>`, **X Produkte** (`_count.products`), Stift-Link zu `/admin/categories/[id]`.
- **Leerzustand:** Hinweis + Link „Erste Kategorie erstellen“.

## Category fields (`Category`)

- `name` * (text)
- `slug` * (text; used across app)
- `icon` (emoji + picker)
- `sortOrder` (number string in UI)

## Per-category filters (`CategoryFilter`)

Managed on the **same** edit page as the category.

**Filter definition fields**

- `name` * (admin label)
- `key` * (machine key, unique per category)
- `type` * — one of: `text`, `number`, `select`, `multiselect`, `brand`
- `unit` (optional)
- `options` — for select/multiselect: newline or comma separated list in UI, stored as `string[]`

**CRUD**

- List filters from `GET /api/admin/categories/[id]/filters`
- Create/update/delete via API routes under `categories/[id]/filters` and `filters/[filterId]`

**Filter types (UI labels in legacy)**

- Text, Zahl, Dropdown (Einzelauswahl), Checkboxen (Mehrfachauswahl), Marke (from brand admin).

These definitions drive **Filter-Werte** on the product edit screen ([products.md](products.md)).
