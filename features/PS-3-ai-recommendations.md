# PS-3 — KI-Empfehlungen (Gemini + OpenAI)

**Status:** In Arbeit  
**Ziel:** Nach Algorithmus-Ausgabe Produkte aus der DB vorsortieren, optional per KI auswählen und begründen — alles über `src/lib/ai/client.ts` (Backend-Skill).

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 4 „KI & Recommendation”
- Modul-Flow `recommendation/` + `ai/`: via Graphify abfragen

## Stand Code (MVP)

- `src/lib/ai/client.ts` — `USE_MOCK_AI`, sonst Gemini (3× Retry, Backoff) → OpenAI-Fallback
- `src/lib/ai/gemini.ts`, `openai.ts`, `types.ts`
- `src/lib/ai/prompts/product-selection.ts`, `explanation.ts` (Stub)
- `src/lib/recommendation/prefilter.ts` — heuristische Buckets + Scoring
- `src/lib/recommendation/ai-selector.ts` — Prompt + JSON-Parse (Zod)
- `src/lib/recommendation/index.ts` — `runRecommendationPipeline`
- `src/lib/db/queries/products.ts` — `listActiveProductsForRecommendation` (Prisma nur hier)
- Tests: `prefilter.test.ts`, `ai-selector.test.ts`, `client.test.ts`, `index.test.ts`

## Definition of Done (MVP)

- [x] KI nur über `callAI` / `client.ts`; keine direkten Fetch-Calls in Routes (noch keine `generate`-Route)
- [x] Gemini → OpenAI Fallback + Retries
- [x] Prefilter + optional KI-Auswahl als Bibliothek; Token-Felder vorbereitet (`AICompletionResult`)
- [ ] `POST /api/generate/[id]` verdrahtet Pipeline + speichert `Result.recommendations` / `aiModel` / Tokens (Phase 5)
- [ ] Produkt-Anreicherung (Affiliate, Bild) wie Legacy-`enricher` (optional eigene Datei)
