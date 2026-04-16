---
name: backend
description: Baut API Routes, Prisma Queries und Server-Logik für PowerSetup. Nutzen bei: API Route anlegen, Datenbankzugriff, Server Action, Prisma Schema ändern, "speichere X in DB", "erstelle Endpoint für Y".
---

# Backend Developer

## Ablauf

1. **Kontext lesen**: Feature-Spec + `docs/reference/schema.prisma` für DB-Referenz
2. **DB-Query**: In `src/lib/db/queries/` schreiben — nie direkt in Route
3. **API Route**: Mit Zod-Validierung, max. 80 Zeilen
4. **Auth prüfen**: Ist die Route admin-only? → Middleware erledigt das automatisch
5. **Übergabe**: "Backend fertig! Nächster Schritt: `/qa` zum Testen"

## Pflicht-Muster für jede Route

```typescript
// src/app/api/example/route.ts
import { ExampleSchema } from '@/lib/schemas/api'
import { getExampleFromDB } from '@/lib/db/queries/example'

export async function POST(request: Request) {
  const body = ExampleSchema.parse(await request.json())
  const result = await getExampleFromDB(body)
  return Response.json(result)
}
```

## Checkliste

- [ ] Prisma nur in `src/lib/db/queries/` — nie direkt in Route
- [ ] Zod-Schema auf alle Inputs
- [ ] KI-Calls nur über `src/lib/ai/client.ts`
- [ ] Amazon-Calls nur über `src/lib/amazon/index.ts`
- [ ] Kein `any` Type
- [ ] Route max. 80 Zeilen
- [ ] Fehler werden geworfen (nicht silent fail)

## Endpoints

- `POST /api/generate/[id]` — **einzige** Stelle, die kalkuliert / den Algorithmus ausführt
- `POST /api/results` — speichert Formulardaten, **keine** Berechnung

## Auth

- `/admin/*` und `/api/admin/*` über `src/proxy.ts` (Next.js `proxy`, ehem. Middleware)
- Kein manueller Auth-Check in normalen Routes nötig
- `process.env.ADMIN_PASSWORD` — niemals hardcoden

## KI

- Retry: 3 Versuche, exponential backoff
- Fallback: Gemini → OpenAI über `src/lib/ai/client.ts`
- Token-Usage immer im `Result` speichern

## Amazon

```
src/lib/amazon/
├── api.ts       ← Creators API (primär)
├── scraper.ts   ← HTML-Scraper (Fallback)
└── index.ts     ← Routing: API → Scraper
```

ENV: `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_PARTNER_TAG`  
Lokal: `USE_MOCK_AMAZON=true` möglich (ohne echte API-Calls)

## Algorithmus-Referenz

Original-Algorithmus: `docs/reference/algorithm/`  
Neue saubere Version: `src/lib/algorithm/` (portieren, nicht copy-pasten)  
Einziger Aufruf-Punkt: `POST /api/generate/[id]`

## PDF (Schaltplan, Dokumente)

Merge/Split/OCR, Formulare, reportlab/pypdf etc.: Skill **[pdf](../pdf/SKILL.md)** — nicht mit diesem Skill duplizieren. Katalog: [skills.sh/anthropics/skills/pdf](https://skills.sh/anthropics/skills/pdf).

## Zahlungen

**Produkt (PowerSetup):** Credits / PDF-Freischaltung über **PayPal** — siehe Feature-Spec `features/PS-6-payments.md` und [REWRITE_PLAN.md](../../../REWRITE_PLAN.md) (Phase 6, Tech Stack).

**Stripe-Skill:** Skill **[stripe-best-practices](../stripe-best-practices/SKILL.md)** nur bei Stripe-spezifischer Arbeit oder Migration nötig (Webhooks, Checkout, Billing). Katalog: [skills.sh/…/stripe-best-practices](https://skills.sh/stripe/agent-toolkit/stripe-best-practices).
