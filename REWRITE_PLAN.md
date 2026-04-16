# PowerSetup — Rewrite Plan

## Context

PowerSetup ist eine mobile-first Web-App die Camping-Anfänger durch die Planung eines kompletten Elektrik-Setups führt (8-Schritt Wizard → KI-Empfehlungen → PDF-Schaltplan).

Der bestehende Code in `/alt/` wird aufgelöst: Wichtiges wird übernommen, alles wird sauber neu geschrieben.

**Primäres Tool: Cursor. Claude Code als Fallback.**

---

## Phase 0: Vorbereitung (erledigen bevor erstes npm install)

### 0.1 Alt-Ordner auflösen

- Algorithm-Logik (`algorithm.ts`, `constants.ts`, `types.ts`, `adapter.ts`, `product-preselection.ts`) → als Referenz in `docs/reference/algorithm/` ablegen
- Prisma Schema → als Referenz in `docs/reference/schema.prisma` ablegen
- Zod-Schemas (`schemas/result.ts`, `schemas/products.ts`) → als Referenz in `docs/reference/schemas/`
- AI-Service (`ai.ts`) → als Referenz in `docs/reference/ai.ts`
- Amazon-Service (`services/amazon/`) → als Referenz in `docs/reference/amazon/` ablegen
- Translations (`messages/de.json`, `messages/en.json`) → direkt in neues `src/messages/` übernehmen
- Alt-Ordner löschen

### 0.2 Config-Struktur anlegen (Cursor-first)

```
PowerSetup/
├── AGENTS.md                          ← Einstiegspunkt für ALLE Tools (Cursor + Claude)
├── CLAUDE.md                          ← Minimal: "Lies AGENTS.md"
│
├── .cursor/
│   └── rules/
│       ├── general.mdc                ← Git, Feature-Tracking, Human-in-the-Loop
│       ├── frontend.mdc               ← shadcn/ui, Tailwind, Responsive, Komponent-Limits
│       ├── backend.mdc                ← Prisma nur in lib/db/queries/, Zod, Auth
│       └── security.mdc               ← Env Vars, Input Validation, Security Headers
│
├── .agents/
│   └── skills/
│       ├── requirements/SKILL.md      ← Feature-Spec schreiben
│       ├── architecture/SKILL.md      ← Architektur-Entscheidungen (kein Code)
│       ├── frontend/SKILL.md          ← React/Next.js Komponenten
│       ├── backend/SKILL.md           ← API Routes, Prisma, DB Queries
│       ├── qa/SKILL.md                ← Testing + Security Audit
│       └── deploy/SKILL.md            ← Vercel Deployment
│
├── .context/
│   ├── architecture.md                ← Dateistruktur, Module (automatisch gepflegt)
│   ├── domain.md                      ← PSH, DoD, MPPT etc. — Fachbegriffe
│   └── conventions.md                 ← Coding-Standards, Patterns
│
├── docs/
│   ├── PRD.md                         ← Existierendes PRD
│   └── reference/                     ← Alt-Code Referenz (read-only, nie bearbeiten)
│       ├── algorithm/
│       │   ├── algorithm.ts
│       │   ├── constants.ts
│       │   ├── types.ts
│       │   ├── adapter.ts
│       │   └── product-preselection.ts
│       ├── schemas/
│       │   ├── result.ts
│       │   └── products.ts
│       ├── ai.ts
│       ├── schema.prisma
│       └── amazon/
│           ├── amazon-service.ts      ← Creators API Original
│           ├── scraper.ts             ← HTML-Scraper Original
│           ├── types.ts
│           └── index.ts
│
└── features/
    ├── INDEX.md                        ← Feature-Tracking
    ├── PS-1-wizard-form.md
    ├── PS-2-algorithm.md
    ├── PS-3-ai-recommendations.md
    ├── PS-4-result-page.md
    ├── PS-5-pdf-export.md
    ├── PS-6-payments.md
    └── PS-7-admin-panel.md
```

---

## Vollständiger Produkt-Flow

```
Wizard-Eingaben
     ↓
Algorithmus (9 Phasen) — lib/algorithm/calculate.ts
→ Berechnet Specs: z.B. "Batterie mind. 200Ah, LiFePO4, 12V"
     ↓
DB-Prefilter — lib/recommendation/prefilter.ts
→ Filtert Produkte aus Prisma-DB nach Specs + Scoring (0-100%)
→ Nur Treffer über Mindest-Score (konfigurierbar in AlgorithmSettings)
→ Top N Produkte pro Kategorie an KI übergeben
     ↓
KI-Auswahl — lib/recommendation/ai-selector.ts
→ Gemini 2.0 (primär) oder OpenAI GPT-4o (Fallback)
→ Wählt beste 2-3 pro Kategorie
→ Generiert Erklärung warum
     ↓
Ergebnis-Seite
→ Produktempfehlungen mit Amazon Affiliate-Links
→ Verbrauchsübersicht (kostenlos)
→ CTA: Schaltplan als PDF (kostenpflichtig)
```

## Amazon-Integration (Admin)

**Zwei parallele Systeme (beide aus Alt übernehmen):**

| System | Datei | Status | Nutzung |
|--------|-------|--------|---------|
| Creators API | `lib/amazon/api.ts` | Code fertig, ungetestet | Primär — offizielle API |
| HTML-Scraper | `lib/amazon/scraper.ts` | Funktioniert, CAPTCHA-Risiko | Fallback |

**Ablauf Admin-Produktimport:**
1. Admin gibt ASIN oder Amazon-URL ein
2. System: Creators API → bei Fehler: HTML-Scraper
3. Titel, Preis, Bild, Features automatisch befüllt
4. KI extrahiert technische Specs aus Features/Titel (Ah, Wp, Kapazität etc.)
5. Admin prüft + speichert in DB

**Neue Struktur:**
```
src/lib/amazon/
├── api.ts          ← Creators API (portiert aus amazon-service.ts)
├── scraper.ts      ← HTML-Scraper (portiert aus scraper.ts)
├── extractor.ts    ← KI-basierte Spec-Extraktion aus Amazon-Daten
├── index.ts        ← Routing: API → Scraper Fallback
└── types.ts        ← AmazonItem Interface
```

**ENV Vars:**
- `AMAZON_CLIENT_ID` — Creators API
- `AMAZON_CLIENT_SECRET` — Creators API
- `AMAZON_PARTNER_TAG` — Affiliate Tag (rasenrobote07-21)
- `USE_MOCK_AMAZON=true` — Mock für lokale Entwicklung

---

## Tech Stack

- **Next.js 16.1** (App Router) + TypeScript + TailwindCSS v4
- **shadcn/ui** (Radix-Basis) + lucide-react
- **Zustand v5** (Wizard State, Persist Middleware)
- **Prisma v7** + PostgreSQL (Prisma Cloud)
- **Google Gemini 2.0** (primär) + **OpenAI GPT-4o** (Fallback)
- **PayPal** (Credit-Käufe)
- **Puppeteer** (PDF-Generierung, serverseitig)
- **next-intl** (i18n: de/en)
- **Vercel** (Hosting) + **Vercel Blob** (Schematics)
- **zod v4** (Validierung durchgehend)

---

## Neue Projektstruktur (sauber)

```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                   ← Landing Page
│   ├── wizard/
│   │   └── [[...step]]/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── result/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── schematic/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   ← Dashboard
│   │   ├── products/
│   │   │   ├── page.tsx               ← Liste mit Filter + Sortierung
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── consumer-devices/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── brands/page.tsx
│   │   ├── settings/page.tsx          ← AI + Algorithm Settings
│   │   ├── results/page.tsx
│   │   └── media/page.tsx
│   ├── api/
│   │   ├── results/
│   │   │   ├── route.ts               ← POST: nur speichern (kein Calc)
│   │   │   └── [id]/route.ts          ← GET/PATCH/DELETE
│   │   ├── generate/
│   │   │   └── [id]/route.ts          ← POST: EINZIGER Calc+KI-Endpoint
│   │   ├── pdf/
│   │   │   └── [id]/route.ts          ← POST: Puppeteer PDF
│   │   ├── payments/
│   │   │   ├── route.ts               ← PayPal Checkout
│   │   │   └── webhook/route.ts
│   │   ├── wizard/route.ts            ← GET: Consumer Devices
│   │   └── admin/                     ← geschützt via Middleware
│   │       ├── products/route.ts
│   │       ├── categories/route.ts
│   │       ├── consumers/route.ts
│   │       ├── brands/route.ts
│   │       └── settings/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                            ← shadcn/ui + Custom
│   │   ├── icon-selector.tsx          ← Kachel-Auswahl (Fahrzeugtyp etc.)
│   │   ├── segmented-control.tsx      ← 12V/24V Toggle
│   │   ├── number-stepper.tsx         ← ±1 Incrementer
│   │   └── progress-steps.tsx         ← 8-Step Indicator
│   ├── wizard/
│   │   ├── WizardShell.tsx            ← Navigation + Progress + Validation
│   │   ├── WizardNavBar.tsx           ← Zurück/Weiter Buttons
│   │   └── steps/
│   │       ├── Step1Vehicle/          ← Fahrzeugtyp, Spannung, Batterietyp
│   │       │   ├── index.tsx          ← max. 150 Zeilen
│   │       │   ├── VehicleTypeGrid.tsx
│   │       │   └── VoltageSelector.tsx
│   │       ├── Step2Energy/           ← Energiequellen
│   │       ├── Step3Consumers/        ← Verbraucher (komplex → aufgeteilt)
│   │       │   ├── index.tsx
│   │       │   ├── ConsumerGrid.tsx
│   │       │   ├── ConsumerCard.tsx
│   │       │   ├── DeviceSearchModal.tsx
│   │       │   └── CustomConsumerForm.tsx
│   │       ├── Step4Travel/           ← Reiseverhalten
│   │       ├── Step5Autarky/          ← Autarkie-Ziel
│   │       ├── Step6Cabling/          ← Kabellängen
│   │       ├── Step7Brands/           ← Markenpräferenzen
│   │       └── Step8Review/           ← Übersicht vor Berechnung
│   ├── result/
│   │   ├── ResultLayout.tsx
│   │   ├── SystemSummaryCard.tsx
│   │   ├── ProductCarousel.tsx
│   │   └── SchematicSection.tsx
│   └── admin/
│       ├── ProductTable.tsx
│       ├── ProductForm.tsx
│       ├── CategoryForm.tsx
│       └── SettingsForm.tsx
│
├── lib/
│   ├── algorithm/                     ← Pure functions, KEINE DB-Abhängigkeit
│   │   ├── calculate.ts               ← Orchestrator (9 Phasen)
│   │   ├── phases/
│   │   │   ├── 1-energy-demand.ts
│   │   │   ├── 2-battery-capacity.ts
│   │   │   ├── 3-solar-yield.ts
│   │   │   ├── 4-booster-sizing.ts
│   │   │   ├── 5-charger-sizing.ts
│   │   │   ├── 6-inverter-sizing.ts
│   │   │   ├── 7-cable-sizing.ts
│   │   │   ├── 8-controller-sizing.ts
│   │   │   └── 9-product-prefilter.ts
│   │   ├── constants.ts               ← Portiert aus Alt (102 Konstanten)
│   │   └── types.ts                   ← AlgorithmInput/Output (kein Adapter)
│   │
│   ├── recommendation/
│   │   ├── index.ts                   ← Einziger Einstiegspunkt
│   │   ├── prefilter.ts               ← Regelbasiert, kein KI
│   │   ├── ai-selector.ts             ← Direkt, kein Adapter
│   │   ├── reasoner.ts                ← Templates + KI-Erklärungen
│   │   └── types.ts
│   │
│   ├── ai/
│   │   ├── client.ts                  ← callAI<T>() mit Retry + Fallback
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   └── prompts/
│   │       ├── product-selection.ts
│   │       └── explanation.ts
│   │
│   ├── db/
│   │   ├── client.ts                  ← Prisma Singleton
│   │   └── queries/
│   │       ├── results.ts
│   │       ├── products.ts
│   │       ├── settings.ts
│   │       └── credits.ts
│   │
│   ├── amazon/
│   │   ├── api.ts                     ← Creators API (portiert)
│   │   ├── scraper.ts                 ← HTML-Scraper Fallback (portiert)
│   │   ├── extractor.ts               ← KI: Specs aus Amazon-Daten extrahieren
│   │   ├── index.ts                   ← API → Scraper Routing
│   │   └── types.ts                   ← AmazonItem Interface
│   │
│   ├── pdf/generator.ts               ← Puppeteer HTML→PDF
│   ├── payments/paypal.ts
│   │
│   └── schemas/
│       ├── wizard.ts                  ← FormData pro Schritt + gesamt
│       ├── products.ts                ← Battery, Inverter, Cable etc.
│       ├── result.ts
│       └── api.ts
│
├── store/
│   ├── wizard.ts                      ← Zustand (Slice-Struktur, nicht Monolith)
│   └── types.ts
│
├── middleware.ts                      ← Auth: /admin/* + /api/admin/*
├── i18n/config.ts
└── messages/
    ├── de.json                        ← Übernommen aus Alt
    └── en.json
```

---

## Prisma Schema (13 Modelle — portiert mit Fixes)

Übernommen aus Alt, mit diesen Korrekturen:
1. `DATABASE_URL` nicht auskommentiert
2. `AlgorithmSettings` Defaults = `constants.ts` Werte
3. `Result.schematicPdfUrl` ergänzt (für Puppeteer PDF)
4. `Result.schematicImageUrl` bleibt (für Vercel Blob)

**Modelle:** Result, Product, Category, CategoryFilter, ConsumerDevice, ConsumerCategory, Brand, BrandFilterCategory, CreditPurchase, CreditBalance, CreditUsage, PromptVersion, SystemSetting, ModelPricing, AlgorithmSettings

---

## Kritische Fixes gegenüber Alt

| # | Problem | Lösung |
|---|---------|--------|
| 1 | `/api/admin/*` ungeschützt | Middleware schützt beide: `/admin/*` + `/api/admin/*` |
| 2 | Doppelte Kalkulation | Nur `POST /api/generate/[id]` rechnet |
| 3 | Adapter-Pattern | Fliegt raus — `AlgorithmOutput` direkt in Recommendation |
| 4 | Kein Retry bei KI | `callAI()` mit 3 Versuchen + exponential backoff |
| 5 | DALL-E statt PDF | Puppeteer PDF (PRD-konform) |
| 6 | Hardcode-Passwort `admin123` | Nur `process.env.ADMIN_PASSWORD` |
| 7 | Brand-Filter ignoriert | Korrekt in Prefilter verdrahtet |
| 8 | DALL-E URL läuft nach 1h ab | Sofort zu Vercel Blob speichern |
| 9 | Monolith Steps (927/1056 Zeilen) | Aufgeteilt in Sub-Komponenten, max. 150 Zeilen |
| 10 | `any` Types überall | Alles Zod-inferred, strict TypeScript |

---

## Config-Datei Inhalte

### `AGENTS.md` (Einstiegspunkt für alle Tools)
```markdown
# PowerSetup — Agent Context

Mobile-first Next.js 16 App. Camping-Elektrik-Planer.
8-Schritt Wizard → KI-Empfehlungen → PDF-Schaltplan.

## Immer zuerst lesen
- `.context/architecture.md` — Dateistruktur und Module
- `.context/domain.md` — Fachbegriffe (PSH, DoD, MPPT etc.)
- `.context/conventions.md` — Coding-Standards

## Skills
- `/requirements` — neues Feature planen
- `/architecture` — technisches Design
- `/frontend` — UI Komponenten bauen
- `/backend` — API + DB
- `/qa` — testen + security
- `/deploy` — Vercel deployment

## Wichtigste Regeln
- Kein direkter Prisma-Aufruf außerhalb `lib/db/queries/`
- Kein `any` — alle Types Zod-inferred
- Max. 150 Zeilen pro Komponenten-Datei
- Nur `/api/generate/[id]` darf kalkulieren
- Nach jeder Architektur-Änderung: `.context/architecture.md` aktualisieren
```

### `CLAUDE.md`
```markdown
Lies AGENTS.md für den vollständigen Projekt-Kontext.
```

### `.cursor/rules/general.mdc`
- `paths: "**/*"` (gilt immer)
- Feature-Tracking via `features/INDEX.md`
- Git Format: `type(PS-X): description`
- Human-in-the-Loop: nie Phase voranschreiten ohne Bestätigung
- Neue Features zuerst via `/requirements` spezifizieren

### `.cursor/rules/frontend.mdc`
- `paths: "**/*.tsx, **/*.css"`
- shadcn/ui Pflicht — immer prüfen bevor Custom-Komponente
- Tailwind CSS only (kein CSS Module, kein Inline)
- Responsive: 375px / 768px / 1440px
- Max. 150 Zeilen pro Datei → sonst auslagern
- Kein `any`, Props immer typisiert

### `.cursor/rules/backend.mdc`
- `paths: "src/app/api/**, src/lib/**"`
- Prisma NUR in `lib/db/queries/` — nie direkt in Routes oder Komponenten
- Zod-Validierung auf ALLE API-Eingaben
- Auth-Check via Middleware (nicht manuell in jeder Route)
- Einzige Berechnungsquelle: `POST /api/generate/[id]`

### `.cursor/rules/security.mdc`
- `paths: "**/*"`
- Keine Secrets im Code — alles in `.env`
- Alle ENV Vars in `.env.example` dokumentieren
- Security Headers in `next.config.ts`
- Inputs immer server-side validieren (Zod), nie nur client-side

### `.cursor/settings.json` (Bash Permissions)
```json
{
  "permissions": {
    "allow": [
      "Bash(npm install *)",
      "Bash(npm run dev)",
      "Bash(npm run build)",
      "Bash(npm run lint)",
      "Bash(npx shadcn@latest add *)",
      "Bash(npx prisma migrate *)",
      "Bash(npx prisma generate)",
      "Bash(npx prisma db push)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git ls-files *)"
    ]
  }
}
```

---

## Skills — vollständiger Inhalt

### `.agents/skills/requirements/SKILL.md`
```yaml
---
name: requirements
description: Schreibt Feature-Specs für PowerSetup. Nutzen wenn: neues Feature geplant wird, User sagt "ich will X", "füge Y hinzu", oder bevor mit dem Coden angefangen wird.
---
# Requirements Engineer

## Ablauf
1. Kläre: Was genau soll passieren? Wer nutzt es? Was ist der MVP?
2. Schreibe Feature-Spec nach `features/PS-X-name.md`
3. Trage Feature in `features/INDEX.md` ein (Status: Planned)
4. Übergabe: "Spec fertig! Nächster Schritt: `/architecture` für technisches Design"

## Feature-Spec Format
- User Stories (Als X möchte ich Y, damit Z)
- Acceptance Criteria (konkret, testbar)
- Edge Cases
- Out of Scope

## Wichtig
- KEIN Code, keine technischen Details
- Definiere WAS, nicht WIE
```

### `.agents/skills/architecture/SKILL.md`
```yaml
---
name: architecture
description: Plant technische Architektur für PowerSetup Features. Nutzen wenn: Architektur-Entscheidung getroffen wird, neues Modul angelegt wird, oder Datenbankschema geändert wird.
---
# Solution Architect

## Ablauf
1. Lies `.context/architecture.md` für aktuellen Stand
2. Lies die Feature-Spec in `features/`
3. Plane: Komponenten, DB-Änderungen, API-Routes, State
4. Kein Code — nur WHAT und WHY
5. Aktualisiere `.context/architecture.md` mit Entscheidung
6. Übergabe: "Architektur geplant! Nächster Schritt: `/frontend` oder `/backend`"

## Regeln
- Kein SQL, kein TypeScript Code
- Prisma-Änderungen → Referenz in `docs/reference/schema.prisma` prüfen
- Neue Routes immer in `api/`-Struktur einordnen
```

### `.agents/skills/frontend/SKILL.md`
```yaml
---
name: frontend
description: Baut React/Next.js UI Komponenten für PowerSetup. Nutzen bei: neue Komponente, Wizard-Step, Seite, UI-Feature, "bau mir X", "zeig Y".
---
# Frontend Developer

## Ablauf
1. Lies Feature-Spec und `.context/architecture.md`
2. Prüfe ob shadcn/ui Komponente existiert → `npx shadcn@latest add X`
3. Baue Komponente (max. 150 Zeilen, Rest auslagern)
4. Teste in Browser (375px mobil zuerst)
5. Übergabe: "Frontend fertig! Nächster Schritt: `/backend` für API-Anbindung"

## Regeln
- shadcn/ui IMMER zuerst prüfen
- Tailwind only — kein CSS Module
- TypeScript strict — kein `any`
- Responsive: 375px → 768px → 1440px
- Loading + Error + Empty States immer einbauen
```

### `.agents/skills/backend/SKILL.md`
```yaml
---
name: backend
description: Baut API Routes, Prisma Queries und Server-Logik für PowerSetup. Nutzen bei: API Route, Datenbankzugriff, Server Action, Prisma Schema Änderung.
---
# Backend Developer

## Ablauf
1. Lies Feature-Spec und `.context/architecture.md`
2. Prüfe `docs/reference/schema.prisma` für Datenmodell-Referenz
3. DB Query in `lib/db/queries/` schreiben (nie direkt in Route)
4. API Route mit Zod-Validierung
5. Auth-Check sicherstellen
6. Übergabe: "Backend fertig! Nächster Schritt: `/qa` zum Testen"

## Regeln
- Prisma NUR in `lib/db/queries/` — nie in app/api/
- Zod auf ALLE Inputs
- Kein direkter SQL
- Nur `/api/generate/[id]` darf kalkulieren
```

### `.agents/skills/qa/SKILL.md`
```yaml
---
name: qa
description: Testet Features und macht Security Audits für PowerSetup. Nutzen bei: "teste X", "bug", "funktioniert nicht", nach Feature-Fertigstellung.
---
# QA Engineer

## Ablauf
1. Acceptance Criteria aus Feature-Spec prüfen
2. Manuell testen (375px mobil + 1440px desktop)
3. Security Audit: Auth-Bypasses, Input-Injection, ungeschützte Routes
4. Bugs nach Schweregrad: Critical / High / Medium / Low
5. Production-ready wenn: kein Critical, kein High offen

## Security Checkliste
- `/api/admin/*` routes → 401 ohne Auth?
- Alle Inputs Zod-validiert?
- ENV Vars nicht im Code?
- PDF/Schaltplan nur nach Credit-Kauf zugänglich?
```

### `.agents/skills/deploy/SKILL.md`
```yaml
---
name: deploy
description: Deployed PowerSetup auf Vercel.
disable-model-invocation: true
---
# Deploy to Vercel

## Pre-Deploy Checks
1. `npm run build` muss erfolgreich sein
2. `npm run lint` ohne Fehler
3. Alle ENV Vars in Vercel gesetzt?
4. Prisma Migrations aktuell?

## Deploy
```bash
git push origin main
```
Vercel deployed automatisch bei Push auf main.

## Post-Deploy
- Production URL testen
- `/api/projects` → 200?
- Admin Login → funktioniert?
- Einen Wizard-Durchlauf machen
```

---

## `.context/` — Initialinhalt

### `.context/architecture.md`
```markdown
# PowerSetup — Architektur

*Wird nach jeder strukturellen Änderung aktualisiert.*

## Kernmodule

| Modul | Pfad | Beschreibung |
|-------|------|--------------|
| Wizard | `src/components/wizard/` | 8-Schritt Formular, Zustand-State |
| Algorithm | `src/lib/algorithm/` | 9-Phasen Berechnung, pure functions |
| Recommendation | `src/lib/recommendation/` | Vorfilter → KI → Anreicherung |
| AI Client | `src/lib/ai/` | Gemini primary, OpenAI fallback, Retry |
| DB Queries | `src/lib/db/queries/` | Alle Prisma-Zugriffe |
| Admin | `src/app/admin/` | Produkte, Kategorien, Settings |

## Wichtigste Regel
Einzige Berechnungsquelle: `POST /api/generate/[id]`

## Entry Points
- Wizard: `src/app/wizard/[[...step]]/page.tsx`
- Result: `src/app/result/[id]/page.tsx`
- Admin: `src/app/admin/page.tsx`
```

### `.context/domain.md`
```markdown
# PowerSetup — Fachbegriffe

## Elektrik
- **Ah** (Amperestunden): Batteriekapazität
- **Wp** (Watt-Peak): Solarmodul-Nennleistung
- **DoD** (Depth of Discharge): Entladetiefe — LiFePO4: 95%, AGM/Gel: 50%
- **PSH** (Peak Sun Hours): Effektive Sonnenstunden je Region/Saison
- **MPPT**: Maximaler Ladestrom-Tracker (effizienter als PWM)
- **PWM**: Puls-Weiten-Modulation (einfacherer Laderegler)
- **Ladebooster (B2B)**: Lädt Servicebatterie während Fahrt von Lichtmaschine

## Fahrzeuge
- Systemspannung: 12V (PKW/Camper), 24V (LKW/große Boote), 48V (selten)
- Bordbatterie: Starterbatterie (nicht für Verbraucher)
- Servicebatterie: Separate Batterie für Verbraucher

## Business-Regeln
- Result-UUID: 90 Tage gültig, dann Hard Delete
- Credits: 1 Schaltplan = 1 Credit. Eingaben ändern = kostenlos. Neue PDF = kostet erneut.
- Kein User-Account — Zugang nur über Result-UUID
- Schaltplan-Varianten: Vereinfacht (Laien) oder Technisch (DIN-Symbole)
```

### `.context/conventions.md`
```markdown
# PowerSetup — Coding Conventions

## TypeScript
- Kein `any` — alle Types Zod-inferred
- Props immer mit Interface definiert
- Server/Client-Typen getrennt halten

## Komponenten
- Max. 150 Zeilen pro Datei
- shadcn/ui zuerst prüfen
- Tailwind only

## State
- Wizard-State: Zustand mit Persist (slices, nicht Monolith)
- Server-State: direkt in Server Components oder über API

## API
- Einzige Berechnungsquelle: `POST /api/generate/[id]`
- Prisma NUR in `lib/db/queries/`
- Zod auf alle API-Inputs

## Git
- Format: `type(PS-X): kurze Beschreibung`
- Types: feat, fix, refactor, test, docs, deploy, chore
```

---

## `features/INDEX.md` — Initialinhalt

```markdown
# PowerSetup — Feature Index

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PS-1 | 8-Schritt Wizard Form | Planned | [PS-1](PS-1-wizard-form.md) |
| PS-2 | Berechnungsalgorithmus | Planned | [PS-2](PS-2-algorithm.md) |
| PS-3 | KI-Empfehlungen | Planned | [PS-3](PS-3-ai-recommendations.md) |
| PS-4 | Ergebnis-Seite | Planned | [PS-4](PS-4-result-page.md) |
| PS-5 | PDF-Export | Planned | [PS-5](PS-5-pdf-export.md) |
| PS-6 | PayPal Credits | Planned | [PS-6](PS-6-payments.md) |
| PS-7 | Admin Panel | Planned | [PS-7](PS-7-admin-panel.md) |
```

---

## Implementierungsphasen (nach Phase 0)

### Phase 1: Foundation
- Next.js 16 Setup, TypeScript, Tailwind v4, shadcn/ui
- Prisma Schema + erste Migration
- Middleware (Admin Auth für beide: `/admin/*` + `/api/admin/*`)
- Basis-UI: IconSelector, SegmentedControl, NumberStepper, ProgressSteps

### Phase 2: Algorithmus
- 9 Phasen aus `docs/reference/algorithm/` portieren
- Je Phase eine eigene Datei in `lib/algorithm/phases/`
- `calculate.ts` als Orchestrator
- Kein Adapter — direkte Typen

### Phase 3: Wizard
- Zustand Store (Slice-Struktur)
- WizardShell + WizardNavBar
- 8 Steps (je max. 150 Zeilen, Sub-Komponenten für den Rest)

### Phase 4: KI & Recommendation
- `lib/ai/client.ts` mit Retry + Gemini→OpenAI Fallback
- Prefilter aus Alt portieren
- AI-Selector direkt (kein Adapter)
- Prompts in eigene Dateien

### Phase 5: Ergebnis-Seite + API
- `POST /api/results` (nur speichern)
- `POST /api/generate/[id]` (Calc + KI — einziger Ort)
- Result-Seite mit ProductCarousel + SystemSummaryCard

### Phase 6: PDF + Payments
- Puppeteer PDF Generator
- `POST /api/pdf/[id]`
- PayPal Credit-Kauf → PDF-Unlock

### Phase 7: Admin Panel
- Produkte CRUD (mit CategoryFilter + Sortierung)
- Kategorien + Filter-Definitionen
- Consumer Devices + Categories
- AlgorithmSettings (alle ~50 Parameter)
- AI Settings (API Keys, Model-Auswahl)
- Results-Übersicht
- Media Manager (Vercel Blob)

### Phase 8: i18n + Polish
- next-intl (de/en — Translations aus Alt übernehmen)
- Mobile-Testing aller Steps (375px)
- Share-Buttons (WhatsApp, Copy Link)
- DSGVO-Texte + Haftungsausschluss
- Security Headers in `next.config.ts`

---

## Verifikation

1. `npm run dev` → localhost:3000 lädt
2. Wizard Schritte 1-8 durchklicken (375px mobil)
3. Ergebnis-Seite zeigt Produktempfehlungen
4. `/admin` fragt nach Passwort; `/api/admin/products` ohne Header → 401
5. "Schaltplan kaufen" → PayPal Sandbox → PDF Download
6. URL `result/{uuid}` nach Browser-Neustart erreichbar
7. Sprache de/en wechseln → alle Texte übersetzt
8. `npm run build` fehlerfrei
