# PS-2 — Berechnungsalgorithmus (9 Phasen)

**Status:** In Arbeit  
**Ziel:** Reiner TypeScript-Algorithmus unter `src/lib/algorithm/` — keine DB in den Phasen; ein Orchestrator `calculate.ts` + eine Datei pro Phase.

## Kurzscope

- Port aus `docs/reference/algorithm/`; Konstanten und Typen übernehmen; kein Legacy-Adapter-Pattern.
- Ausgabe speist Prefilter / Recommendation (siehe [REWRITE_PLAN.md](../REWRITE_PLAN.md) Produkt-Flow).

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 2 „Algorithmus“, Abschnitt „Neue Projektstruktur“ → `src/lib/algorithm/`.
- **Stand Code:** `src/lib/algorithm/calculate.ts` (Orchestrator), `phases/*.ts`, `types.ts`, `constants.ts`; Phase 9 nur Platzhalter (DB-Prefilter → später `src/lib/recommendation/prefilter.ts`).

## Definition of Done (MVP)

- [x] Neun Phasen-Module + Orchestrator; deterministisch testbar (Golden-Snapshot: `src/lib/algorithm/calculate.snapshot.test.ts`)
- [x] Keine Prisma-Imports unter `src/lib/algorithm/`

### Offen (über MVP hinaus / spätere Phasen)

- [ ] Umfangreiche Einheiten-Tests pro Phase (Randfälle, Overrides, alle `energySources`-Kombinationen)
- [ ] `POST /api/generate/[id]` verdrahtet den Orchestrator (Phase 5)

Vollständige Acceptance Criteria: bei Bedarf mit `/requirements` ergänzen.
