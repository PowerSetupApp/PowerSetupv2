# Admin — products

Sources: [`../old/src/app/admin/products/page.tsx`](../old/src/app/admin/products/page.tsx), [`products-table.tsx`](../old/src/components/admin/products/products-table.tsx), [`../old/src/app/admin/products/[id]/page.tsx`](../old/src/app/admin/products/[id]/page.tsx), [`product-filter.tsx`](../old/src/app/admin/products/product-filter.tsx), [`import-product-dialog.tsx`](../old/src/components/admin/products/import-product-dialog.tsx), [`update-product-dialog.tsx`](../old/src/components/admin/products/update-product-dialog.tsx).

## List (`/admin/products`)

- Header: total count, **+ Neues Produkt**, optional **Import** / **Produkt importieren** (öffnet Dialog — siehe unten).
- **ProductFilter:** text search, category dropdown “Alle Kategorien”.
- **ProductsTable:**
  - **Lücken-Filter** (mehrere Checkboxen, **ODER**): Zeilen, die mindestens eine aktivierte Bedingung erfüllen.
    - **Unvollständige Filter-Werte** — `CategoryFilter`-Keys der Kategorie (außer `brand`) fehlen oder sind leer in `filterValues` (PS-7).
    - **Ohne Foto oder Preis** — kein `imageUrl` oder `price` ist leer.
    - **Ohne Algorithmus-Spec** — gleiche Slug-/Feldregeln wie die Katalogabdeckung „ohne Spec“ (`powerW` / `currentA` / `crossSectionMm2` je nach Kategorie); unabhängig von „Aktiv“.
  - **Sichtbare aktualisieren (N)** — opens `UpdateProductDialog` for filtered rows (Amazon/metadata refresh).
  - Columns: thumbnail + name + `updatedAt`, category badge, price €, status (Aktiv/Inaktiv), actions: public site link, edit, row menu (delete, etc. via `ProductActions`).
- **Row menu (⋯)** mindestens: **Bei Amazon ansehen**, **Bearbeiten**, **Löschen** (Löschen hervorgehoben/destructive).

## Dialog: Produkt importieren

Quelle: [`import-product-dialog.tsx`](../old/src/components/admin/products/import-product-dialog.tsx).

- **Copy:** Import von Amazon mit KI; Kategorie und ASIN/URL nötig.
- **Felder:** **Kategorie** * (Dropdown, Platzhalter „Kategorie wählen…“); Hilfe: Kategorie bestimmt extrahierte technische Daten.
- **ASIN oder Amazon-Link** * (Placeholder mit Beispiel-URL); Hilfe mit **Test-ASINs** für MPPT / LiFePO4 / Wechselrichter wie im Legacy.
- **Buttons:** **Abbrechen**, **Scrape (Backup)**, **Importieren** (Primary, ggf. disabled bis gültig).

## Edit product (`/admin/products/[id]`)

Header: back to list; title **Produkt bearbeiten**; subtitle = name.

**Toolbar actions**

- **Update** — opens `UpdateProductDialog` (Amazon-based refresh for this product).
- **Amazon** — external link from affiliate URL + partner tag (`getAmazonLink` helper).
- **Löschen** — confirm + DELETE.

**Form sections**

1. **Grunddaten**
   - `name` * (text)
   - `categoryId` * (select); changing category clears `filterValues`.
   - `price` — “Preis (für KI-Kontext) €” (number)
   - `icon` — emoji text + picker modal
   - `isActive` — checkbox “Produkt ist aktiv”

2. **Filter-Werte** (only if category has filters from `GET /api/admin/categories/{id}/filters`)
   - Explainer text about prefiltering before AI.
   - Renders `FilterField` per `CategoryFilter` (types: text, number, select, multiselect, brand); brand filter supports inline **+** new brand (`POST /api/admin/brands` when present in full app).
   - Optional banner when `?suggestedBrand=` query present: create brand from suggestion.
   - Values stored in `filterValues` JSON; legacy typed columns synced on load when empty.

3. **Bild & Links**
   - `imageUrl` — read-only input + **Mediathek** opens `MediaModal` (real upload: `POST /api/admin/media/upload`).
   - Thumbnail preview when URL set.
   - `affiliateUrl` * (Amazon link); on change, ASIN parsed client-side.
   - **Amazon Details** accordion: shows derived `asin`, static marketplace “amazon.de”.

4. **Technische Spezifikationen (Markdown)**
   - `specs` in large textarea.
   - **Mit KI optimieren** — `POST /api/admin/optimize-specs` with `{ specs }`; uses `getAISettings().specsOptimizationPrompt` and active text model.

Submit: **Speichern** / **Abbrechen** — persists via `PUT /api/admin/products/[id]` (and related client handlers in page).

## New product (`/admin/products/new`)

- Gleiche fachliche Tiefe wie Bearbeiten, aber ohne bestehende ID: **Grunddaten**, **Bild & Links** (Mediathek, Affiliate-URL *, Amazon-Details), **Technische Spezifikationen** + **Mit KI optimieren**.
- **Filter-Werte** erscheinen, sobald eine **Kategorie mit CategoryFiltern** gewählt ist (wie Edit).
- Aktionen: **Produkt erstellen**, **Abbrechen**; optional derselbe **Import**-Dialog wie in der Liste.

## Related APIs

See [api-routes.md](api-routes.md): `products`, `categories/.../filters`, `optimize-specs`, `media/upload`, `brands` (if restored).
