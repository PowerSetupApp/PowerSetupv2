# PowerSetup — Kontext-Atlas (Architektur)

**Zweck:** Kompakte Navigation für Agenten — Ordnerüberblick, Zuständigkeiten, Kopplungen. Keine Coding-Regeln (→ `.context/conventions.md`), kein Fachlexikon (→ `.context/domain.md`).

**Pflege:** Nach strukturellen Änderungen im **selben Arbeitsgang** aktualisieren. **Zielgröße:** ≤ ~180 Zeilen; bei Wachstum Zeilen **zusammenführen oder streichen**, nicht blind anhängen.

## Top-Level (Tiefe 2)

```
src/
├── app/           Next.js App Router (Pages, API Routes, Layouts)
├── components/  geteilte UI (`ui/` primitives, `marketing/` z. B. `marketing-hero.tsx`, `wizard/`)
├── generated/   Prisma Client (generator `prisma-client`, nicht manuell editieren)
├── lib/           algorithm/, recommendation/, ai/, db/, amazon/, affiliate/, schemas/, results/, pdf/, payments/
├── store/         `wizard.ts` — Zustand + Persist (`AlgorithmInput`-Formular)
├── proxy.ts       Basic Auth: `/admin/*`, `/api/admin/*` (Next.js `proxy` convention)
docs/reference/   Legacy + Specs (kein produktiver Code): `ADMIN-AGENT-BRIEF.md`, `admin/*`, `old/src`
prisma/            `schema.prisma`, `migrations/`, Root: `prisma.config.ts` (Prisma ORM 7, `DATABASE_URL`)
```

## Kernmodule (Ownership)

| Modul | Pfad | Beschreibung |
|-------|------|--------------|
| Wizard | `src/components/wizard/` | 8-Schritt Formular; Step 3 `steps/step-3-consumers/`, Step 6 `steps/step-6-cables/`, Step 8 `steps/step-8-*.tsx` + `use-wizard-step8-canonical-previews.ts` (Vorschau ohne Balance-Overrides) |
| Wizard (lib) | `src/lib/wizard/` | `validation.ts`, `cable-length-keys.ts`, `group-consumer-templates.ts`, `step8-solar-battery-balance.ts` (Slider-Math), `top-up-covers-daily.ts` (Hinweis Autarkie vs. Top-up) |
| Algorithm | `src/lib/algorithm/` | `compute.ts` (Orchestrator), `types.ts`, `constants.ts`, `phases/*.ts` (Solar trennt Dach `controller` vs. Tasche `portableController`) |
| Recommendation | `src/lib/recommendation/` | `prefilter.ts`, `ai-selector.ts`, `index.ts` (`runRecommendationPipeline`) |
| AI Client | `src/lib/ai/` | `client.ts` (Retry, Mock `USE_MOCK_AI`), `gemini.ts` (`AbortController`, Key via Header), `openai.ts`, `prompts/*` |
| DB Queries | `src/lib/db/queries/` | Alle Prisma-Zugriffe zentralisiert; Reads über `readFromDatabase` (→ `DbReadResult<T>`); Mutationen rufen `updateTag(CACHE_TAGS.*)` |
| DB Client | `src/lib/db/client.ts` | `PrismaClient` mit `@prisma/adapter-pg` + `pg` (`DATABASE_URL`) |
| Cache | `src/lib/cache/tags.ts` | Zentrale `CACHE_TAGS`-Registry für Next 16 `use cache` / `cacheTag` / `updateTag` |
| Money | `src/lib/money.ts` | `decimalToNumber[OrZero]` — Prisma `Decimal` → DTO `number` an der Query-Grenze |
| Rate Limit | `src/lib/ratelimit/` | In-Memory Token-Bucket; aktiv auf `POST /api/generate/[id]` |
| Prisma Errors | `src/lib/db/prisma-errors.ts` | `readFromDatabase` + `DbReadResult` (`database_unavailable`-Kanal) |
| Amazon | `src/lib/amazon/` | Creators API + Scraper-Fallback |
| Admin Media | `src/lib/db/queries/admin-media.ts` + `src/lib/admin/media-actions.ts` | `@vercel/blob` Wrapper (put/list/del), 503 ohne `BLOB_READ_WRITE_TOKEN`; API `POST /api/admin/media/upload` |
| Admin AI Specs | `src/lib/admin/ai-specs.ts` → `src/lib/ai/client.ts` | Prompt-Rendering + `callAI`; API `POST /api/admin/optimize-specs` |
| PDF | `src/lib/pdf/` | Puppeteer HTML→PDF |
| Payments | `src/lib/payments/` | PayPal SDK |
| Admin | `src/app/admin/` | Dashboard, Produkte, Marken, Kategorien, Mediathek, Verbraucher + -Kategorien, Ergebnisse, Einstellungen — Spec [docs/reference/ADMIN-AGENT-BRIEF.md](../docs/reference/ADMIN-AGENT-BRIEF.md) |
| Result (Endnutzer) | `src/app/result/[id]/`, `src/components/result/`, `src/lib/results/*`, `POST /api/results`, `POST /api/wizard/algorithm-preview` | PS-4: speichern, generieren, Wizard-Schritt-8-Vorschau |
| Zod (API-Input) | `src/lib/schemas/` | z. B. `wizard-input.ts` für Results-API |
| Affiliate | `src/lib/affiliate/` | Amazon-Partner-Tag an Produkt-URLs |

## Kopplung / Blast-Radius (bei Änderungen prüfen)

| Wenn du änderst … | … zusätzlich prüfen |
|-------------------|---------------------|
| `src/app/api/generate/[id]/route.ts` | `src/lib/algorithm/calculate.ts`, `src/lib/recommendation/`, DB-Queries, AI-Client |
| `src/lib/algorithm/**` | `POST /api/generate/[id]`, betroffene Phasen-Eingaben aus dem Wizard |
| `src/lib/recommendation/**` | `generate`-Route, `src/lib/ai/`, `src/lib/db/queries/products` (o.ä.) |
| `src/lib/db/queries/**` | alle Aufrufer in API Routes und `src/lib/recommendation` (kein Prisma außerhalb dieser Queries) |
| `src/lib/schemas/wizard-input.ts` | `POST /api/results`, `POST /api/wizard/algorithm-preview`, `runGenerateForResultId` |
| `src/lib/wizard/cable-length-keys.ts` | Wizard Step 6 UI + `validation.ts` Schritt 6 |
| `src/components/wizard/**` | `src/store/wizard.ts`, betroffene Steps in `src/app/wizard/` |
| `src/store/wizard.ts` | Wizard-Komponenten, Persistenz/URLs der Steps |
| `src/proxy.ts` | `src/app/admin/**`, `src/app/api/admin/**` |
| `src/lib/pdf/**` | Ergebnis-Flows / API, die PDF auslösen |
| `src/lib/amazon/**` | Admin-Produktimport (`src/app/admin/products/`, zugehörige API Routes) |
| `prisma/schema.prisma` (falls vorhanden) | `src/lib/db/queries/`, Migrationen, betroffene Types |

## Datei-Flow: Berechnung (idempotent, status-driven)

```
src/app/result/[id]/page.tsx          ← Server Component, NUR lesen (kein Calc)
  → rendert <ResultGenerateRetry initialStatus … />   ← Client, Auto-Trigger + Poll
src/app/api/generate/[id]/route.ts    ← Rate-Limit + Idempotenz-Guard
  → src/lib/results/generate-for-result.ts
    → src/lib/db/queries/results.ts#tryClaimGenerationSlot   ← atomares UPDATE … WHERE
    → src/lib/algorithm/calculate.ts  ← 9-Phasen Orchestrator
    → src/lib/recommendation/index.ts ← Prefilter → KI → validateAISelections
      → src/lib/db/queries/products.ts (DbReadResult)
      → src/lib/ai/client.ts (Gemini/OpenAI + Timeout)
    → markGenerationFailed / updateResultAfterGeneration (→ succeeded)
```

Der `GenerationStatus`-Enum (`idle`/`pending`/`succeeded`/`failed`) steuert
Idempotenz und Client-Polling. Parallele POSTs bekommen `202 Accepted` solange
`pending`; rate-limited Clients `429`.

```
POST /api/results/route.ts → src/lib/db/queries/results.ts (nur persistieren, kein Calc)
POST /api/wizard/algorithm-preview/route.ts → mergeDbSettingsAndCalculate (wie generate vor KI)
```

## Datei-Flow: Admin Produkt-Import

```
src/app/admin/products/new/page.tsx
  → src/app/api/admin/products/route.ts
    → src/lib/amazon/index.ts       ← API → Scraper Fallback
    → src/lib/db/queries/products.ts
```

## Entry Points

- Wizard: `src/app/wizard/[[...step]]/page.tsx`
- Result: `src/app/result/[id]/page.tsx`
- Admin: `src/app/admin/page.tsx`
- Landing: `src/app/(marketing)/page.tsx`

## Auth-Schutz

`src/proxy.ts` schützt via Basic Auth (constant-time `timingSafeEqual`, kein Dev-Bypass):

- `/admin/*` — Web-UI
- `/api/admin/*` — API Routes

Secret-Exports (`GET /api/admin/export/[domain]?includeSecrets=1`) verlangen
zusätzlich den Header `X-Include-Secrets: 1` und schreiben Audit-Log.

Security-Header (CSP, HSTS, X-Frame-Options, Referrer-Policy, …) werden in
`next.config.ts#headers()` global gesetzt.

## Zustand Store

`src/store/wizard.ts` — persistierter Wizard-Formularzustand als `AlgorithmInput` (8 URL-Schritte: Basis → Energie → Verbraucher → Reise → Autarkie → Kabel → Marken → Review); Step 8 → `POST /api/results` → `/result/[id]` → ggf. `POST /api/generate/[id]` bzw. serverseitiges `runGenerateForResultId`.
