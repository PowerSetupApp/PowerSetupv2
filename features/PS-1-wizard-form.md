# PS-1 — 8-Schritt Wizard (Formular)

**Status:** In Arbeit  
**Ziel:** Mobile-first Wizard (`/wizard/[[...step]]`) mit Zustand, Validierung und Sub-Komponenten pro Schritt (max. ~150 Zeilen pro UI-Datei).

## Kurzscope

- WizardShell, Navigation, Fortschritt; Steps 1–8 wie in [REWRITE_PLAN.md](../REWRITE_PLAN.md) („Neue Projektstruktur“ → `components/wizard/`).
- Consumer Devices, Markenpräferenzen, Review vor Berechnung.

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 3 „Wizard“, Produkt-Flow (Eingaben → Algorithmus).

## Stand Code (MVP-Skelett)

- `src/store/wizard.ts` — Zustand `persist`, State = `AlgorithmInput` (keine parallele DTO-Schicht).
- `src/components/wizard/wizard-shell.tsx`, `wizard-nav-bar.tsx`, `wizard-step-body.tsx`, `steps/step-*.tsx`.
- `src/lib/wizard/validation.ts` — „Weiter“ / Fortschritts-Klicks; Tests in `validation.test.ts`.
- URL: `/wizard` → Redirect `/wizard/1` … `/wizard/8`.

## Definition of Done (MVP)

- [x] Alle 8 Schritte durchklickbar (mobil 375px zuerst)
- [x] State persistiert sinnvoll (Zustand + Persist)
- [x] Keine Berechnung im Wizard — nur Navigation bis „Berechnen“ (Button deaktiviert bis Phase 5)

### Offen (über MVP / später)

- [ ] Verbraucher aus Katalog (`GET /api/wizard` Consumer Devices) statt nur Freitext-Liste
- [ ] Feinere Validierung / Zod pro Schritt, Fehlermeldungen unter Feldern
- [ ] Sub-Komponenten pro Step-Ordner (REWRITE_PLAN) sobald Steps > ~150 Zeilen wachsen

Vollständige User Stories und Edge Cases: bei Bedarf mit `/requirements` ausarbeiten.
