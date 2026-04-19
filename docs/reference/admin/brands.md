# Admin — brands (Marken)

Sources: [`../old/src/app/admin/brands/page.tsx`](../old/src/app/admin/brands/page.tsx), [`../old/src/app/actions/brands.ts`](../old/src/app/actions/brands.ts), [`brand-list.tsx`](../old/src/components/admin/brands/brand-list.tsx), [`add-brand-dialog.tsx`](../old/src/components/admin/brands/add-brand-dialog.tsx), [`edit-brand-dialog.tsx`](../old/src/components/admin/brands/edit-brand-dialog.tsx), [`brand-category-mapping.tsx`](../old/src/components/admin/brands/brand-category-mapping.tsx).

## Page header

- **Title:** „Marken Verwaltung“ (oder gleichwertig).
- **Subtitle:** bevorzugte Marken für Ladeelektronik und Batterien (Legacy-Text).
- **Primary action:** **+ Marke hinzufügen** → öffnet Erstellungs-Dialog.

## Section: „Alle Marken“

- **Search:** Feld „Suchen…“ filtert die Markenliste (client- oder serverseitig wie Legacy).
- **Table columns (Zielbild):**
  - **Name**
  - **Im Wizard** / **Sichtbarkeit** — entspricht `showInPreferences` (Marke in Wizard-Auswahllisten).
  - **Status** — `isActive` (z. B. Badge/Label).
  - **Aktionen** — Bearbeiten, Löschen (Icons/Menü wie Legacy).
- **Empty state:** „Keine Marken gefunden“.
- **Edit:** Dialog/Sheet mit Feldern aus `edit-brand-dialog` (u. a. `name`, `types` als `CHARGER` / `BATTERY` / `SOLAR`, `showInPreferences`, `isActive` — exakt aus Komponente übernehmen).

## Dialog: „Neue Marke erstellen“

- **Title:** „Neue Marke erstellen“.
- **Description:** neue Marke, die im Wizard zur Auswahl steht.
- **Fields:** **Name** (Placeholder z. B. Victron Energy); Toggle **Im Wizard anzeigen** (`showInPreferences`) mit Hilfetext „Marke in den Auswahl-Listen anzeigen?“.
- **Primary:** **Erstellen**.

## Section: „Kategorien-Zuordnung für Marken-Präferenzen“

- **Intro text (Semantik):** Welche **Produktkategorien** (Product `Category.slug`) gehören zu welcher **Wizard-Gruppe**; im Wizard erscheinen in einem Dropdown nur Marken, die **aktive Produkte** in mindestens einer zugeordneten Kategorie haben (Legacy-Logik — in `brand-category-mapping` / Actions prüfen).

- **Three wizard groups** (UI-Blöcke mit Checkbox-Raster derselben Kategorie-Labels):

| Gruppe (Label) | Typische Zuordnung (Beispiel aus Live-Admin) |
|----------------|-----------------------------------------------|
| Ladeelektronik (Ladegeräte, Booster, …) | Solar-Laderegler, Wechselrichter, Batterieladegeräte, Ladebooster |
| Batterien | Batterien |
| Solarmodule | Solarmodule, Solartaschen |

- **Vollständiges Raster** (alle wählbaren Produktkategorien-Labels müssen aus DB/Slug-Liste kommen, nicht hardcoden außer als Seed):  
  Solar-Laderegler, Kabel, Sicherungskästen, Wechselrichter, Solarmodule, Kabel: Laderegler – Batterie, Batterien, Batterieladegeräte, Kabel: Laderegler – Solarmodul, Solartaschen, Sicherungen, Ladebooster  
  (exakte Schreibweisen = `Category.name` im System).

- **Persistence:** `BrandFilterCategory`: `key`, `label`, `categorySlugs[]`, `sortOrder`.

## Server actions

`getBrands`, `createBrand`, `updateBrand`, `deleteBrand`, `getBrandFilterCategories`, `getProductCategories`, Upsert für Mapping — siehe [`../old/src/app/actions/brands.ts`](../old/src/app/actions/brands.ts).

## Brands API vs Server Actions

Produktseiten rufen `fetch("/api/admin/brands")` auf; im Snapshot **fehlt** `app/api/admin/brands/route.ts`. Markenliste auf `/admin/brands` nutzt **Server Actions**.

**Umsetzung im Neubau:** entweder `route.ts` ergänzen **oder** Produkt-Flow auf Server Actions umstellen und `fetch` entfernen — siehe [api-routes.md](api-routes.md).
