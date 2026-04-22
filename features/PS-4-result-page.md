# PS-4 — Ergebnis-Seite + persistente URLs

**Status:** Planned  
**Ziel:** Ergebnis unter `/result/[id]` mit Empfehlungen, Verbrauchsübersicht, CTA PDF; API nur speichern / laden / generieren getrennt.

## Kurzscope

- `POST /api/results` — nur persistieren, keine Kalkulation.
- `POST /api/generate/[id]` — einziger Calc+KI-Endpoint (siehe [REWRITE_PLAN.md](../REWRITE_PLAN.md) Phase 5).
- UI: SystemSummary, Produktkarussell, Schaltplan-Sektion.

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 5, „Kritische Fixes“ (#2 Doppelte Kalkulation).

## Definition of Done (MVP)

- [ ] Result-UUID nach Reload erreichbar (Retention 30 Tage, siehe `src/lib/results/result-helpers.ts`)
- [ ] Affiliate-Links / Darstellung wie PRD

Vollständige Spec: bei Bedarf mit `/requirements` vertiefen.
