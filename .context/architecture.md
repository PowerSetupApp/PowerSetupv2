# PowerSetup — Kontext-Atlas (Architektur)

**Zweck:** Kompakte Navigation für Agenten — Ordnerüberblick, Zuständigkeiten, Kopplungen. Keine Coding-Regeln (→ `.context/conventions.md`), kein Fachlexikon (→ `.context/domain.md`).

**Pflege:** Nach strukturellen Änderungen im **selben Arbeitsgang** aktualisieren. **Zielgröße:** ≤ ~180 Zeilen; bei Wachstum Zeilen **zusammenführen oder streichen**, nicht blind anhängen.

## Top-Level (Tiefe 2)

```
src/
├── app/           Next.js App Router (Pages, API Routes, Layouts)
├── components/  geteilte UI (`ui/` primitives, `marketing/`, später `wizard/`)
├── generated/   Prisma Client (generator `prisma-client`, nicht manuell editieren)
├── lib/           algorithm/, recommendation/, ai/, db/, amazon/, pdf/, payments/
├── store/         Client-State (Wizard) — noch anzulegen (Phase 3)
├── proxy.ts       Basic Auth: `/admin/*`, `/api/admin/*` (Next.js `proxy` convention)
docs/reference/   Legacy + Specs (kein produktiver Code): `ADMIN-AGENT-BRIEF.md`, `admin/*`, `old/src`
prisma/            `schema.prisma`, `migrations/`, Root: `prisma.config.ts` (Prisma ORM 7, `DATABASE_URL`)
```

## Kernmodule (Ownership)

| Modul | Pfad | Beschreibung |
|-------|------|--------------|
| Wizard | `src/components/wizard/` | 8-Schritt Formular, Zustand-State |
| Algorithm | `src/lib/algorithm/` | `calculate.ts` (Orchestrator), `types.ts`, `constants.ts`, `phases/*.ts` (PS-2) |
| Recommendation | `src/lib/recommendation/` | Prefilter → KI → Anreicherung |
| AI Client | `src/lib/ai/` | Gemini primary, OpenAI fallback, Retry-Logik |
| DB Queries | `src/lib/db/queries/` | Alle Prisma-Zugriffe zentralisiert |
| DB Client | `src/lib/db/client.ts` | `PrismaClient` mit `@prisma/adapter-pg` + `pg` (`DATABASE_URL`) |
| Amazon | `src/lib/amazon/` | Creators API + Scraper-Fallback |
| PDF | `src/lib/pdf/` | Puppeteer HTML→PDF |
| Payments | `src/lib/payments/` | PayPal SDK |
| Admin | `src/app/admin/` | Dashboard, Produkte, Marken, Kategorien, Mediathek, Verbraucher + -Kategorien, Ergebnisse, Einstellungen — Spec [docs/reference/ADMIN-AGENT-BRIEF.md](../docs/reference/ADMIN-AGENT-BRIEF.md) |

## Kopplung / Blast-Radius (bei Änderungen prüfen)

| Wenn du änderst … | … zusätzlich prüfen |
|-------------------|---------------------|
| `src/app/api/generate/[id]/route.ts` | `src/lib/algorithm/calculate.ts`, `src/lib/recommendation/`, DB-Queries, AI-Client |
| `src/lib/algorithm/**` | `POST /api/generate/[id]`, betroffene Phasen-Eingaben aus dem Wizard |
| `src/lib/recommendation/**` | `generate`-Route, `src/lib/ai/`, `src/lib/db/queries/products` (o.ä.) |
| `src/lib/db/queries/**` | alle Aufrufer in API Routes und `src/lib/recommendation` (kein Prisma außerhalb dieser Queries) |
| `src/components/wizard/**` | `src/store/wizard.ts`, betroffene Steps in `src/app/wizard/` |
| `src/store/wizard.ts` | Wizard-Komponenten, Persistenz/URLs der Steps |
| `src/proxy.ts` | `src/app/admin/**`, `src/app/api/admin/**` |
| `src/lib/pdf/**` | Ergebnis-Flows / API, die PDF auslösen |
| `src/lib/amazon/**` | Admin-Produktimport (`src/app/admin/products/`, zugehörige API Routes) |
| `prisma/schema.prisma` (falls vorhanden) | `src/lib/db/queries/`, Migrationen, betroffene Types |

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

`src/proxy.ts` schützt:

- `/admin/*` — Web-UI
- `/api/admin/*` — API Routes

## Zustand Store

`src/store/wizard.ts` — Wizard-Slices step1–step7 (Fahrzeug/Energie/Verbraucher/Reise/Autarkie/Kabel/Marken); bei Step-Änderungen Wizard-UI und ggf. Algorithmus-Eingaben abstimmen.
