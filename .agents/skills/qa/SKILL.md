---
name: qa
description: Testet Features und macht Security Audits für PowerSetup. Nutzen bei: "teste X", "gibt es Bugs", "ist das sicher", "funktioniert nicht", nach Feature-Fertigstellung vor Commit.
---

# QA Engineer

## Ergänzung: externe Skills (nur bei Bedarf laden)

- **Bug, unklarer Fehler, Build/CI, Integration:** zuerst **[systematic-debugging](../systematic-debugging/SKILL.md)** (Root Cause vor Fix). [skills.sh/…/systematic-debugging](https://skills.sh/obra/superpowers/systematic-debugging)
- **Neue oder geänderte Logik** in `src/lib/**` (z. B. Algorithmus), reine Hilfsfunktionen oder API-Verhalten, das sich für Automatisierung eignet: **[test-driven-development](../test-driven-development/SKILL.md)**. [skills.sh/…/test-driven-development](https://skills.sh/obra/superpowers/test-driven-development)  
  PowerSetup-Workflow bleibt: Feature-Spec (`/requirements`) und Freigaben aus diesem Skill unverändert.

## Ablauf

1. **Acceptance Criteria prüfen**: Feature-Spec lesen, jeden Punkt testen
2. **Manuell testen**: 375px mobil + 1440px desktop
3. **Security Audit**: Kritische Punkte durchgehen
4. **Bugs kategorisieren**: Critical / High / Medium / Low
5. **Report**: Fertig wenn kein Critical, kein High offen

## Test-Checkliste (Standard)

- [ ] Alle Acceptance Criteria aus Feature-Spec erfüllt?
- [ ] Mobil (375px): Touch-Targets groß genug?
- [ ] Leere Zustände: was passiert ohne Daten?
- [ ] Fehler-Zustände: was passiert bei API-Fehler?
- [ ] Browser-Refresh: State erhalten?

## Security-Checkliste

- [ ] `/api/admin/*` ohne Auth → 401?
- [ ] Alle API-Inputs Zod-validiert (nie nur client-side)?
- [ ] Keine Secrets im Code — nur `.env.local` / Vercel; `.env.example` dokumentiert Platzhalter
- [ ] ENV Vars nicht im Frontend-Code?
- [ ] PDF/Schaltplan nur nach Credit-Kauf zugänglich?
- [ ] `AMAZON_PARTNER_TAG` nie im Frontend; Affiliate-Links server-seitig?
- [ ] Keine rohen User-Strings in Prisma ohne Zod davor?
- [ ] Keine Secrets in Fehlermeldungen?

### Security Headers (`next.config.ts`)

Projekt erwartet u. a.: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`.

### Änderungen nur mit expliziter Freigabe

Vor dem Umsetzen kurz bestätigen lassen bei: Middleware, neuen ENV Vars, Auth-Logik, Prisma-Schema (Migration).

## Bug-Schweregrade

| Schweregrad | Beispiel | Blockiert Deploy? |
|-------------|----------|-------------------|
| **Critical** | Auth-Bypass, Datenverlust | Ja |
| **High** | Kernfunktion kaputt (Wizard, Berechnung) | Ja |
| **Medium** | Funktion kaputt, Workaround möglich | Nein |
| **Low** | Kosmetisch, UX-Problem | Nein |
