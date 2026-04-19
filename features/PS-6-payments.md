# PS-6 — PayPal Credits

**Status:** Planned  
**Ziel:** Credits für PDF-Schaltplan; **Zahlungsanbieter im Produkt: PayPal** (Sandbox/Prod). Kein Stripe in der MVP-Produktbeschreibung — siehe Abgrenzung unten.

## Kurzscope

- Endpoints `src/app/api/payments/` + Webhook wie in [REWRITE_PLAN.md](../REWRITE_PLAN.md) Phase 6.
- CreditPurchase / Balance / Usage laut `docs/reference/schema.prisma`.

## Stripe-Skill (nur Referenz)

Der Skill **stripe-best-practices** ist für allgemeine Zahlungs-/Webhook-Muster gedacht, **nicht** der kanonische Stack für PowerSetup-Credits. Kanonisch: PayPal + diese Spec + `AGENTS.md`.

## Architektur-Referenz

- [REWRITE_PLAN.md](../REWRITE_PLAN.md) — Tech Stack (PayPal), Phase 6, Verifikation (#5).

## Definition of Done (MVP)

- [ ] Kauf-Flow Sandbox end-to-end; PDF-Unlock nach erfolgreicher Zahlung
- [ ] Keine Secrets im Client

Vollständige Spec: bei Bedarf mit `/requirements` vertiefen.
