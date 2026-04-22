# PowerSetup — Feature Index

**Ausführung (Lesereihenfolge für Agenten):** [AGENTS.md](../AGENTS.md) (Regeln, Skills, Produkt-Flow) → [REWRITE_PLAN.md](../REWRITE_PLAN.md) (Phasen, Zielstruktur) → Projekt-Kontext via Graphify → untenstehende PS-Specs. Admin separat: [docs/reference/ADMIN-AGENT-BRIEF.md](../docs/reference/ADMIN-AGENT-BRIEF.md), [PS-7-admin-panel.md](PS-7-admin-panel.md).

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PS-1 | 8-Schritt Wizard Form | In Arbeit | [PS-1](PS-1-wizard-form.md) |
| PS-2 | Berechnungsalgorithmus (9 Phasen) | In Arbeit | [PS-2](PS-2-algorithm.md) |
| PS-3 | KI-Empfehlungen (Gemini + OpenAI) | In Arbeit | [PS-3](PS-3-ai-recommendations.md) |
| PS-4 | Ergebnis-Seite + Persistente URLs | In Arbeit | [PS-4](PS-4-result-page.md) |
| PS-5 | PDF-Schaltplan Export (Puppeteer) | Planned | [PS-5](PS-5-pdf-export.md) |
| PS-6 | PayPal Credit-System | Planned | [PS-6](PS-6-payments.md) |
| PS-7 | Admin Panel (vollständige Funktions-Spec + DoD) | Planned | [PS-7](PS-7-admin-panel.md) |
| PS-8 | Amazon Produkt-Import (ASIN) | Planned | [PS-8](PS-8-amazon-import.md) |
| PS-9 | i18n (Deutsch + Englisch) | Planned | [PS-9](PS-9-i18n.md) |

## Querschnittsthemen (ohne eigene PS-Spec)

- **Code-Audit 2026-04 (6 Dimensionen, applied):** Idempotente Generate-Pipeline mit `GenerationStatus`-Enum und atomarem `tryClaimGenerationSlot`, Rate-Limit auf `POST /api/generate/[id]`, Prisma `Decimal` für Geldbeträge + `CreditPurchase`-FK, `readFromDatabase`/`DbReadResult`, Next 16 `cacheComponents` + zentrale Cache-Tags (`src/lib/cache/tags.ts`), Security-Headers/CSP + `timingSafeEqual` Basic Auth, AI-Fetch mit `AbortController`/Header-Key, Zod-Constraints + AI-Hallucination-Filter.

