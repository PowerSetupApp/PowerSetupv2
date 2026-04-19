# Settings page (`/admin/settings`)

Source: [`../old/src/app/admin/settings/page.tsx`](../old/src/app/admin/settings/page.tsx)

Single page with **tabs** (`defaultValue="ai"`):

| Tab id | Label | Component |
|--------|-------|-----------|
| `ai` | KI & Modelle | `AISettings` |
| `algorithm` | Algorithmus | `AlgorithmSettings` |
| `pricing` | Preise | `PricingSettings` |
| `amazon` | Amazon | `AmazonSettings` |

Page title: **Einstellungen**; subtitle: configure system and AI behaviour.

---

## Tab: KI & Modelle (`ai-settings.tsx`)

Sections (cards):

1. **KI-Provider & API-Keys** — Radio: Google Gemini vs OpenAI; password fields for Gemini + OpenAI keys.
2. **Produktempfehlung Modell** — Select chat model + refresh list from provider.
3. **Bildgenerierung Modell** — Select image model + refresh.
4. **Prompt Template (Empfehlungen)** — Large textarea (`userPromptTemplate`) + placeholder chips.
5. **Prompt Template (Bildgenerierung)** — Textarea (`imagePromptTemplate`) + placeholders including `{{SELECTED_PRODUCTS}}`.
6. **Prompt Template (Produkt-Specs Optimierung)** — Textarea (`specsOptimizationPrompt`) with `{{INPUT}}` chip; used by `POST /api/admin/optimize-specs`.

Footer: **Speichern** → `updateAISettings(...)`.

---

## Tab: Algorithmus (`algorithm-settings.tsx`)

- Sticky bar: title “Berechnungsparameter”, **Zurücksetzen** (reload from server), **Speichern** (disabled until dirty).
- **Recommendation Engine** card:
  - **Produktauswahl:** `productSelectionMode` — `algorithm` | `hybrid`.
  - **Begründungstexte:** `reasonGenerationMode` — `algorithm` | `ai` | `none`.
- **Grouped numeric/string fields:** see `SETTINGS_GROUPS` in the same file (DoD, simultaneity, alternator amps, battery space, safety factors, standing days, max backup days, solar Wp/m² and factors, sun hours, location modifiers, duty cycles, shore charge times, component class strings, voltage drops, copper resistivity, `minPreselectionScore`).
- **Komponentenklassen** card: extra **DB-Sync** button → `syncComponentClassesFromDB()` (derives comma lists from live products).
- **Algorithm-Check** summary card at bottom: clickable highlights scroll to field.

Persistence: `AlgorithmSettings` row `id = "default"` via [`../old/src/app/actions/algorithm-settings.ts`](../old/src/app/actions/algorithm-settings.ts).

---

## Tab: Preise (`pricing-settings.tsx`)

- Two cards: **OpenAI Modellpreise** and **Google Gemini Modellpreise**.
- Table columns: model display + id, input $/1M, output $/1M, per-row save (enabled when edited).
- **Preise aktualisieren** per provider → `fetchAndSaveModelPricing`.

---

## Tab: Amazon (`amazon-settings.tsx`)

- Single card **Amazon Partnerprogramm**: input **Partner Tag** (`amazon_partner_tag`), help text that tag is appended to product links.
- **Speichern** → `updateGeneralSettings`.
