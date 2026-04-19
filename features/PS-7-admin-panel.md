# PS-7 — Admin Panel (Vollspec für Umsetzung)

**Ziel:** Admin-Bereich neu implementieren (beliebiges Layout), mit **funktionaler Parität** zum Legacy PowerSetup-Admin.  
**Publikum:** Nur Betreiber — **nicht** die Endnutzer-Oberfläche (die = Wizard + Ergebnis, andere Design-Anforderungen).

## Pflichtlektüre (Reihenfolge)

1. [docs/reference/ADMIN-AGENT-BRIEF.md](../docs/reference/ADMIN-AGENT-BRIEF.md) — Scope Admin vs Nutzer, Links.
2. [docs/reference/admin/README.md](../docs/reference/admin/README.md) — Detailindex.
3. [docs/reference/schema.prisma](../docs/reference/schema.prisma) — Datenmodell.
4. Legacy-Code: [docs/reference/old/src/app/admin/](../docs/reference/old/src/app/admin/) und [docs/reference/old/src/components/admin/](../docs/reference/old/src/components/admin/).

---

## Navigation (Sidebar)

Reihenfolge und Ziele wie Legacy ([routes-and-navigation.md](../docs/reference/admin/routes-and-navigation.md)):

Dashboard → Produkte → Marken → Kategorien → Mediathek → Verbraucher → Verbr.-Kategorien → Ergebnisse → Einstellungen; Footer **Zur Website** → `/`.

---

## Dashboard (`/admin`)

- KPI: Anzahl Produkte gesamt + „X aktiv“; Anzahl Kategorien; Anzahl **Results** in den **letzten 7 Tagen**.
- Schnellaktionen: **Neues Produkt** (`/admin/products/new`), **Neue Kategorie** (Navigation zu Kategorien-Übersicht).
- Kein weiterer Pflichtinhalt im Legacy — zusätzliche Widgets optional.

[details →](../docs/reference/admin/dashboard.md)

---

## Produkte

### Liste (`/admin/products`)

- Titel + **„N Produkte insgesamt“**.
- **+ Neues Produkt**; wo im Legacy vorhanden: Eintrag **Produkt importieren** (Dialog).
- **Suchen…** (Volltext/Name laut Implementierung).
- Dropdown **Alle Kategorien** (Filter nach Produktkategorie).
- Checkbox **Nur unvollständige zeigen** — Unvollständigkeit = für die Produktkategorie definierte `CategoryFilter`-Keys (außer **`brand`**) fehlen/leer in `filterValues`.
- **Sichtbare aktualisieren (N)** — Bulk-Refresh (Amazon/Metadaten) für aktuell gefilterte Liste.
- Tabelle: Thumbnail, Name, Datum (`updatedAt` o. Ä.), Kategorie-Badge, Preis €, Status (Aktiv/Inaktiv), Aktionen: Link öffentlich/Amazon, Bearbeiten, **⋯-Menü** (z. B. Bei Amazon ansehen, Bearbeiten, Löschen).

### Produkt importieren (Dialog)

- Titel z. B. **Produkt importieren**; Kurztext: Import von Amazon mit KI, Kategorie wählen, ASIN oder URL.
- Felder: **Kategorie** * (Dropdown); **ASIN oder Amazon-Link** *; Hilfstext mit Test-ASINs (wie Legacy).
- Aktionen: **Abbrechen**, **Scrape (Backup)**, **Importieren** (Primary).

### Neu (`/admin/products/new`)

- Abschnitte mindestens: **Grunddaten** (Name, Kategorie, Preis KI-Kontext, Icon), **Bild & Links** (Bild/Mediathek, Affiliate-URL *, Amazon-Details falls vorhanden), **Technische Spezifikationen (Markdown)** inkl. **Mit KI optimieren**.
- **Filter-Werte** erscheinen sobald Kategorie Filter definiert hat (wie Edit-Seite).

### Bearbeiten (`/admin/products/[id]`)

- Kopfzeile: Zurück, **Produkt bearbeiten**, Untertitel = Produktname.
- Buttons: **Update** (Amazon-Refresh-Dialog), **Amazon** (extern mit Partner-Tag), **Löschen**.
- Formularabschnitte wie in [products.md](../docs/reference/admin/products.md): Grunddaten → Filter-Werte (dynamisch) → Bild & Links (Mediathek-Modal, Vorschau, Amazon-Link *, Accordion Amazon Details mit ASIN) → Markdown-Specs + KI-Optimierung (`POST /api/admin/optimize-specs`).
- Speichern / Abbrechen.

[details →](../docs/reference/admin/products.md)

---

## Kategorien (`/admin/categories`)

- **Übersicht:** Kacheln / Karten pro Kategorie: Icon, Name, Slug, Produktanzahl, Link Bearbeiten; **+ Neue Kategorie**.
- **Bearbeiten** (`/admin/categories/[id]`): Stammdaten + **Filter-Definitionen** (Typen: Text, Zahl, Select, Multiselect, Marke; Optionen für Selects).

[details →](../docs/reference/admin/categories.md)

---

## Marken (`/admin/brands`)

- **Kopf:** „Marken Verwaltung“, erklärender Untertitel; **+ Marke hinzufügen**.
- **Alle Marken:** Suche „Suchen…“; Tabelle **Name**, Spalte für **Wizard-Sichtbarkeit** (z. B. „Im Wizard“ / „Sichtbarkeit“ — mapped auf `showInPreferences`), **Status** (`isActive`), **Aktionen** (Bearbeiten/Löschen); leerer Zustand „Keine Marken gefunden“.
- **Neue Marke** (Modal): Name; Toggle **Im Wizard anzeigen** (`showInPreferences`); ggf. weitere Felder wie im `add-brand-dialog` / `edit-brand-dialog` im Legacy-Code.
- **Kategorien-Zuordnung für Marken-Präferenzen:** drei Blöcke (Ladeelektronik, Batterien, Solarmodule) mit **Checkbox-Raster** aller Produktkategorien; Persistenz = `BrandFilterCategory` (`categorySlugs`).

[details →](../docs/reference/admin/brands.md)

---

## Mediathek (`/admin/media`)

- Seite: Upload-Bereich, Hinweis zu keinen externen Amazon-Bildern, Leerzustand („Noch keine Bilder…“) sobald angebunden.
- **Produktbearbeitung:** `MediaModal` + `POST /api/admin/media/upload` ist der **produktive** Uploadweg.

[details →](../docs/reference/admin/media.md)

---

## Verbraucher (`/admin/consumer-devices`)

- Übersicht gruppiert nach **ConsumerCategory**; pro Gerät: Icon, Name (+ ggf. Key), Standardwerte (W, Spannung/„System“, min/Tag), Badges (z. B. Kühlgerät), Featured, Aktionen.
- **+ Neues Gerät**; New/Edit-Formular: Basisdaten, Standardwerte, Konfiguration & UI (Switches), Sortierung — siehe Legacy-Seite.

[details →](../docs/reference/admin/consumer-devices-and-categories.md)

---

## Verbraucher-Kategorien (`/admin/consumer-categories`)

- Tabelle: Icon, Name, Slug, Geräteanzahl, Sortierung, Aktionen; **+ Neue Kategorie**.

[details →](../docs/reference/admin/consumer-devices-and-categories.md)

---

## Ergebnisse (`/admin/results`)

- Titel **Ergebnisse & Kosten**; Tabelle **letzte 90 Tage** (oder gleichwertiger Zeitraum wie Legacy): Datum, KI-Modell, Tokens In/Out, geschätzte Kosten, Link zu `/result/[id]`.
- **Aktualisieren**-Button.

[details →](../docs/reference/admin/results.md)

---

## Einstellungen (`/admin/settings`)

Vier Tabs (Reihenfolge):

1. **KI & Modelle** — Provider, API-Keys, Chat-Modell, Bild-Modell, Prompts (Empfehlungen, Bildgenerierung, Specs-Optimierung mit `{{INPUT}}`), Speichern.
2. **Algorithmus** — `AlgorithmSettings` + Recommendation Engine (Modi) + ggf. DB-Sync für Komponentenklassen; siehe [settings-ui.md](../docs/reference/admin/settings-ui.md).
3. **Preise** — `ModelPricing` Tabellen OpenAI/Gemini, Preise aktualisieren, manuelle Eingabe $/1M Tokens.
4. **Amazon** — Partner-Tag (`amazon_partner_tag`), Speichern.

Keys: [system-settings-keys.md](../docs/reference/admin/system-settings-keys.md)

---

## APIs (`/api/admin/*`)

Vollständige Liste und Hinweis **Brands**: [api-routes.md](../docs/reference/admin/api-routes.md)

---

## Abnahmekriterien (Definition of Done)

- [ ] Alle Sidebar-Routen existieren; Auth wie im Zielprojekt (`/admin/*` + ` /api/admin/*`).
- [ ] Produkte: Suche, Kategoriefilter, Unvollständig-Filter (ohne `brand`), Bulk-Update, Import-Dialog, Edit/New inkl. dynamischer Filter und Specs-KI.
- [ ] Kategorien inkl. Filter-Editor pro Kategorie.
- [ ] Marken inkl. Mapping-UI und Wizard-Sichtbarkeit.
- [ ] Mediathek-Upload aus Produkt heraus funktioniert (persistente URL).
- [ ] Verbraucher-Geräte + -Kategorien CRUD.
- [ ] Ergebnisse-Liste mit Link zum Result und Kostenanzeige (sofern Preise gepflegt).
- [ ] Einstellungen: alle vier Tabs speichern korrekt in DB (`SystemSetting`, `PromptVersion`, `AlgorithmSettings`, `ModelPricing`).
- [ ] Brands-Erstellung aus Produkt heraus: **kein** toter Endpunkt (REST oder ausschließlich Server Actions — konsistent dokumentiert im Code).
