# Admin — results (`/admin/results`)

Source: [`../old/src/app/admin/results/page.tsx`](../old/src/app/admin/results/page.tsx), [`../old/src/app/actions/results.ts`](../old/src/app/actions/results.ts) (imported as `getResults`).

## UI

- Title **Ergebnisse & Kosten**; subtitle about generated results and API cost; **Aktualisieren** reloads.
- Card **Generierte Ergebnisse (letzte 90 Tage)** — table columns:
  - **Datum** — date + time (`date-fns`, `de` locale)
  - **KI-Modell** — `Result.aiModel` badge or “-”
  - **Tokens (In/Out)** — `inputTokens` / `outputTokens`
  - **Kosten (ca.)** — Schätzung aus Tokens × `ModelPricing` (fuzzy Match auf `aiModel`); Legacy rechnet intern USD→EUR-Faktor und zeigt Badge (z. B. mit **Ct** und deutschem Komma); Tooltip nennt **$/1M** Input/Output aus der Preistabelle
  - **Link** — opens `/result/[id]` in new tab

## Data

- `getResults()` supplies rows with `id`, `createdAt`, `aiModel`, tokens, `formData` (not all shown in table).

## Dependencies

Requires populated `ModelPricing` (see [settings-ui.md](settings-ui.md) pricing tab) for non-zero cost estimates.
