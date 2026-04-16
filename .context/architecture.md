# PowerSetup — Architektur

> Diese Datei wird nach jeder strukturellen Änderung aktualisiert.
> Stand: Projekt-Setup (vor erstem Commit)

## Kernmodule

| Modul | Pfad | Beschreibung |
|-------|------|--------------|
| Wizard | `src/components/wizard/` | 8-Schritt Formular, Zustand-State |
| Algorithm | `src/lib/algorithm/` | 9-Phasen Berechnung, pure functions, keine DB |
| Recommendation | `src/lib/recommendation/` | Prefilter → KI → Anreicherung |
| AI Client | `src/lib/ai/` | Gemini primary, OpenAI fallback, Retry-Logik |
| DB Queries | `src/lib/db/queries/` | Alle Prisma-Zugriffe zentralisiert |
| Amazon | `src/lib/amazon/` | Creators API + Scraper-Fallback |
| PDF | `src/lib/pdf/` | Puppeteer HTML→PDF |
| Payments | `src/lib/payments/` | PayPal SDK |
| Admin | `src/app/admin/` | Produkte, Kategorien, Settings, Ergebnisse |

## Datei-Flow: Berechnung

```
src/app/api/generate/[id]/route.ts   ← EINZIGER Calc-Endpoint
  → src/lib/algorithm/calculate.ts  ← 9-Phasen Orchestrator
    → src/lib/algorithm/phases/     ← Je eine Datei pro Phase
  → src/lib/recommendation/index.ts ← Prefilter → KI → Ergebnis
    → src/lib/db/queries/products.ts
    → src/lib/ai/client.ts
```

## Datei-Flow: Admin Produkt-Import

```
src/app/admin/products/new/page.tsx
  → src/app/api/admin/products/route.ts
    → src/lib/amazon/index.ts       ← API → Scraper Fallback
    → src/lib/db/queries/products.ts
```

## Entry Points

- Wizard: `src/app/wizard/[[...step]]/page.tsx`
- Result: `src/app/result/[id]/page.tsx`
- Admin: `src/app/admin/page.tsx`
- Landing: `src/app/(marketing)/page.tsx`

## Auth-Schutz

`src/middleware.ts` schützt:
- `/admin/*` — Web-UI
- `/api/admin/*` — API Routes

## Zustand Store

`src/store/wizard.ts` — Slice-Struktur:
- `step1` — Fahrzeugtyp, Spannung, Batterietyp
- `step2` — Energiequellen
- `step3` — Verbraucher
- `step4` — Reiseverhalten
- `step5` — Autarkie-Ziel
- `step6` — Kabellängen
- `step7` — Markenpräferenzen
