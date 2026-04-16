# PowerSetup — Rewrite Plan

## Context

PowerSetup ist eine mobile-first Web-App die Camping-Anfänger durch die Planung eines kompletten Elektrik-Setups führt (8-Schritt Wizard → KI-Empfehlungen → PDF-Schaltplan).

Der bestehende Code in `/alt/` wird aufgelöst: Wichtiges wird übernommen, alles wird sauber neu geschrieben.

**Primäres Tool: Cursor. Claude Code als Fallback.**

### Referenz: Admin & Legacy (für Phase 7 + Datenmodell)


| Dokument                                                                   | Zweck                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [docs/reference/ADMIN-AGENT-BRIEF.md](docs/reference/ADMIN-AGENT-BRIEF.md) | Einstieg: Admin vs. Endnutzer, Lesereihenfolge, Brands-API-Hinweis |
| [docs/reference/admin/README.md](docs/reference/admin/README.md)           | Admin-Funktionsinventar (pro Bereich Markdown)                     |
| [features/PS-7-admin-panel.md](features/PS-7-admin-panel.md)               | Vollspec + **Definition of Done** Admin                            |
| [docs/reference/old/README.md](docs/reference/old/README.md)               | Legacy-`src/`-Snapshot (read-only)                                 |
| [docs/reference/schema.prisma](docs/reference/schema.prisma)               | Prisma-Referenz                                                    |


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
│       ├── frontend.mdc               ← verweist auf frontend-Skill
│       ├── backend.mdc                ← verweist auf backend-Skill (Prisma nur src/lib/db/queries/)
│       ├── security.mdc               ← Env, Validation, Security Headers
│       └── testing.mdc                ← Vitest / Testdateien (siehe AGENTS.md)
│
├── .agents/
│   └── skills/
│       ├── requirements/SKILL.md
│       ├── architecture/SKILL.md
│       ├── frontend/SKILL.md          ← inkl. Design-/UX-Anhänge (siehe Skill)
│       ├── backend/SKILL.md
│       ├── qa/SKILL.md
│       ├── deploy/SKILL.md
│       ├── web-design-guidelines/SKILL.md
│       ├── next-cache-components/SKILL.md
│       ├── pdf/SKILL.md
│       ├── stripe-best-practices/SKILL.md
│       ├── systematic-debugging/SKILL.md
│       └── test-driven-development/SKILL.md
│
├── .context/
│   ├── architecture.md                ← Dateistruktur, Module (automatisch gepflegt)
│   ├── domain.md                      ← PSH, DoD, MPPT etc. — Fachbegriffe
│   └── conventions.md                 ← Coding-Standards, Patterns
│
├── docs/
│   ├── PRD.md                         ← Existierendes PRD
│   └── reference/                     ← Alt-Code + Specs (read-only, nie produktiver Code)
│       ├── ADMIN-AGENT-BRIEF.md       ← Einstieg Admin vs. Nutzer
│       ├── admin/                     ← Admin-Funktionsinventar (*.md)
│       ├── old/                       ← Legacy src-Snapshot
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
    ├── PS-7-admin-panel.md
    ├── PS-8-amazon-import.md
    └── PS-9-i18n.md
```

---

## Vollständiger Produkt-Flow

```
Wizard-Eingaben
     ↓
Algorithmus (9 Phasen) — src/lib/algorithm/calculate.ts
→ Berechnet Specs: z.B. "Batterie mind. 200Ah, LiFePO4, 12V"
     ↓
DB-Prefilter — src/lib/recommendation/prefilter.ts
→ Filtert Produkte aus Prisma-DB nach Specs + Scoring (0-100%)
→ Nur Treffer über Mindest-Score (konfigurierbar in AlgorithmSettings)
→ Top N Produkte pro Kategorie an KI übergeben
     ↓
KI-Auswahl — src/lib/recommendation/ai-selector.ts
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


| System       | Datei                       | Status                       | Nutzung                 |
| ------------ | --------------------------- | ---------------------------- | ----------------------- |
| Creators API | `src/lib/amazon/api.ts`     | Code fertig, ungetestet      | Primär — offizielle API |
| HTML-Scraper | `src/lib/amazon/scraper.ts` | Funktioniert, CAPTCHA-Risiko | Fallback                |


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
│   │   ├── consumer-categories/
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
│   │       ├── products/...
│   │       ├── categories/...         ← inkl. categories/[id]/filters/...
│   │       ├── consumer-devices/...
│   │       ├── consumer-categories/...
│   │       ├── brands/route.ts
│   │       ├── media/upload/route.ts
│   │       ├── optimize-specs/route.ts
│   │       └── settings/route.ts     ← oder Server Actions wie Legacy
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
├── proxy.ts                           ← Auth: /admin/* + /api/admin/* (Next.js `proxy`)
├── i18n/config.ts
└── messages/
    ├── de.json                        ← Übernommen aus Alt
    └── en.json
```

---

## Prisma Schema (15 Modelle — portiert mit Fixes)

Übernommen aus Alt, mit diesen Korrekturen:

1. `DATABASE_URL` nicht auskommentiert
2. `AlgorithmSettings` Defaults = `constants.ts` Werte
3. `Result.schematicPdfUrl` ergänzt (für Puppeteer PDF)
4. `Result.schematicImageUrl` bleibt (für Vercel Blob)

**Modelle:** Result, Product, Category, CategoryFilter, ConsumerDevice, ConsumerCategory, Brand, BrandFilterCategory, CreditPurchase, CreditBalance, CreditUsage, PromptVersion, SystemSetting, ModelPricing, AlgorithmSettings

---

## Kritische Fixes gegenüber Alt


| #   | Problem                          | Lösung                                                   |
| --- | -------------------------------- | -------------------------------------------------------- |
| 1   | `/api/admin/`* ungeschützt       | Middleware schützt beide: `/admin/`* + `/api/admin/*`    |
| 2   | Doppelte Kalkulation             | Nur `POST /api/generate/[id]` rechnet                    |
| 3   | Adapter-Pattern                  | Fliegt raus — `AlgorithmOutput` direkt in Recommendation |
| 4   | Kein Retry bei KI                | `callAI()` mit 3 Versuchen + exponential backoff         |
| 5   | DALL-E statt PDF                 | Puppeteer PDF (PRD-konform)                              |
| 6   | Hardcode-Passwort `admin123`     | Nur `process.env.ADMIN_PASSWORD`                         |
| 7   | Brand-Filter ignoriert           | Korrekt in Prefilter verdrahtet                          |
| 8   | DALL-E URL läuft nach 1h ab      | Sofort zu Vercel Blob speichern                          |
| 9   | Monolith Steps (927/1056 Zeilen) | Aufgeteilt in Sub-Komponenten, max. 150 Zeilen           |
| 10  | `any` Types überall              | Alles Zod-inferred, strict TypeScript                    |


---

## Konfiguration und Skills (kanonische Quellen)

Dieses Dokument ist der **Rewrite-Fahrplan**. Volltexte für Agenten, Cursor-Rules und Skills werden **nicht** hier dupliziert (vermeidet Drift und spart Kontext).


| Thema                                           | Pfad                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent-Einstieg, Skill-Tabelle, kritische Regeln | [AGENTS.md](AGENTS.md)                                                                                                                             |
| Kurzpointer Claude Code                         | [CLAUDE.md](CLAUDE.md)                                                                                                                             |
| Cursor Rules (schlank; verweisen auf Skills)    | [.cursor/rules/](.cursor/rules/) — `general.mdc`, `frontend.mdc`, `backend.mdc`, `security.mdc`, `testing.mdc`                                     |
| Kern-Workflow-Skills                            | [.agents/skills/](.agents/skills/) — u. a. `requirements`, `architecture`, `frontend`, `backend`, `qa`, `deploy` (jeweils `SKILL.md`)              |
| Zusätzliche Skills                              | siehe Abschnitt in [AGENTS.md](AGENTS.md) unter *Zusätzlich installiert*                                                                           |
| Kontext-Atlas, Domain, Konventionen             | [.context/architecture.md](.context/architecture.md), [.context/domain.md](.context/domain.md), [.context/conventions.md](.context/conventions.md) |
| Feature-Tracking                                | [features/INDEX.md](features/INDEX.md)                                                                                                             |


**Optional:** Bash-Allowlist für automatisierte Agent-Runs in `.cursor/settings.json` (nur falls im Workspace angelegt; kein Pflichtbestandteil).

## Implementierungsphasen (nach Phase 0)

### Phase 1: Foundation

- Next.js 16 Setup, TypeScript, Tailwind v4, shadcn/ui
- Prisma Schema + erste Migration
- Middleware (Admin Auth für beide: `/admin/`* + `/api/admin/*`)
- Basis-UI: IconSelector, SegmentedControl, NumberStepper, ProgressSteps

### Phase 2: Algorithmus

- 9 Phasen aus `docs/reference/algorithm/` portieren
- Je Phase eine eigene Datei in `src/lib/algorithm/phases/`
- `calculate.ts` als Orchestrator
- Kein Adapter — direkte Typen

### Phase 3: Wizard

- Zustand Store (Slice-Struktur)
- WizardShell + WizardNavBar
- 8 Steps (je max. 150 Zeilen, Sub-Komponenten für den Rest)

### Phase 4: KI & Recommendation

- `src/lib/ai/client.ts` mit Retry + Gemini→OpenAI Fallback
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
- **Funktions-Referenz:** [ADMIN-AGENT-BRIEF.md](docs/reference/ADMIN-AGENT-BRIEF.md) → [admin/](docs/reference/admin/README.md) + [old/](docs/reference/old/README.md); Checkliste [PS-7-admin-panel.md](features/PS-7-admin-panel.md)

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

