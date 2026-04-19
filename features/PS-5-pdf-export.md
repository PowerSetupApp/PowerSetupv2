# PS-5 — PDF-Schaltplan (Puppeteer)

**Status:** Planned  
**Ziel:** Serverseitig HTML → PDF (Puppeteer), Download nur nach Credit-Kauf; URL / Blob-Handling PRD-konform.

## Kurzscope

- `POST /api/pdf/[id]`; Referenz zu Legacy + PRD in [REWRITE_PLAN.md](../REWRITE_PLAN.md) Phase 6 und „Kritische Fixes“ (#5, #8).
- Skill für generische PDF-Operationen: `.agents/skills/pdf/SKILL.md` (nicht Geschäftslogik duplizieren).

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 6 „PDF + Payments“ (PDF-Teil).

## Definition of Done (MVP)

- [ ] PDF ohne gültigen Credit / Auth nicht auslieferbar (QA-Checkliste)
- [ ] Keine DALL-E-Abhängigkeit für Schaltplan

Vollständige Spec: bei Bedarf mit `/requirements` vertiefen.
