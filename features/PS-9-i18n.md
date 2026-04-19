# PS-9 — Internationalisierung (Deutsch + Englisch)

**Status:** Planned  
**Ziel:** **next-intl**; Messages unter `src/messages/` (de/en), Übernahme aus Alt wo möglich.

## Kurzscope

- Konfiguration `src/i18n/config.ts`; alle Nutzer- und Admin-sichtbaren Texte über Übersetzungskeys (Admin kann eigene Keys/Priorität laut Architektur).
- Überlappt mit [REWRITE_PLAN.md](../REWRITE_PLAN.md) Phase 8 „i18n + Polish“ — eine Quelle für Phasenplan: der Rewrite-Plan; diese Spec für Feature-Tracking.

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Phase 8, Phase 0 (Translations aus Alt).

## Definition of Done (MVP)

- [ ] Sprache umschaltbar; keine hardcodierten User-Strings in Wizard/Result (Ausnahmen dokumentieren falls minimal nötig)
- [ ] `npm run build` mit beiden Locales grün

Vollständige Spec: bei Bedarf mit `/requirements` vertiefen.
