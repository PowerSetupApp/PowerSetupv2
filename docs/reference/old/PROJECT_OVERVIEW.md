# PowerSetup – Projektdokumentation

> Erstellt durch automatisches Code-Review am 2026-04-10

---

## 1. Executive Summary

**PowerSetup** ist eine mobile-first Webanwendung, die Camping-Einsteigern hilft, ein vollständiges, sicheres und normkonformes Elektrik-Setup für ihr Fahrzeug (Wohnmobil, Caravan, Kastenwagen, Boot) zu planen.

**Kernfunktionen:**
- 8-Schritt-Wizard zur Erfassung von Fahrzeug, Verbrauchern, Reiseverhalten und Präferenzen
- Deterministischer Algorithmus zur Berechnung aller Systemanforderungen (Batterie, Solar, Kabel etc.)
- Hybrides KI-System (Google Gemini / OpenAI) zur Produktauswahl und Texterklärungen
- Produktempfehlungen mit Amazon-Affiliate-Links
- Optionaler KI-generierter Schaltplan (DALL-E 3) gegen PayPal-Zahlung (1 Credit)
- Admin-Panel zur Verwaltung von Produkten, Kategorien, KI-Einstellungen und Algorithmus-Parametern

**Zielgruppe:** Laien ohne Elektrik-Kenntnisse, die ein Camper-Elektrik-Setup planen wollen.

**Zielmarkt:** DACH-Region (Deutsch/Englisch, EU-Normen, D-A-CH Sonnenstunden-Daten)

---

## 2. Tech Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| **Framework** | Next.js (App Router) | 15+ |
| **Sprache** | TypeScript | 5 |
| **Styling** | TailwindCSS + shadcn/ui | 4 |
| **State Management** | Zustand | 5.0.9 |
| **Datenbank** | PostgreSQL (Vercel/Neon) | - |
| **ORM** | Prisma | 7.2.0 |
| **KI – Text** | Google Gemini 2.0 (Standard) + OpenAI GPT-4o (Fallback) | - |
| **KI – Bilder** | OpenAI DALL-E 3 | - |
| **Datei-Storage** | Vercel Blob | 2.0.0 |
| **Payments** | PayPal OrdersV2 API | - |
| **i18n** | next-intl | 4.6.1 |
| **Validierung** | Zod | 4.2.1 |
| **Icons** | lucide-react | - |
| **Toasts** | sonner | 2.0.7 |
| **HTML-Parsing** | cheerio (Amazon-Scraping) | 1.1.2 |
| **Deployment** | Vercel | - |

---

## 3. Verzeichnisstruktur

```
PowerSetup/
├── prisma/
│   ├── schema.prisma              # Datenbankschema (13 Modelle)
│   ├── migrations/                # Prisma-Migrationen
│   └── migrations/manual/         # Manuelle SQL-Migrationen
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (marketing)/           # Route Group: Öffentliche Marketingseiten
│   │   │   └── page.tsx           # Landing Page
│   │   ├── wizard/                # Mehrstufiger Eingabe-Wizard
│   │   │   ├── [[...step]]/       # Dynamisches Routing (Schritt 1-8)
│   │   │   └── layout.tsx         # Wizard-Layout
│   │   ├── result/[id]/           # Ergebnis-Seiten
│   │   │   ├── page.tsx           # Produktempfehlungen-Anzeige
│   │   │   └── schematic/         # Schaltplan-Generierung (Checkout, Generierung)
│   │   ├── admin/                 # Admin-Panel (HTTP Basic Auth geschützt)
│   │   │   ├── page.tsx           # Dashboard
│   │   │   ├── products/          # Produkt-CRUD
│   │   │   ├── categories/        # Kategorie-CRUD
│   │   │   ├── brands/            # Marken-Verwaltung
│   │   │   ├── consumer-devices/  # Wizard-Geräte-CRUD
│   │   │   ├── results/           # Vergangene Berechnungen
│   │   │   ├── media/             # Vercel Blob Asset Manager
│   │   │   └── settings/          # Algorithmus- & KI-Einstellungen
│   │   ├── api/                   # API-Routen
│   │   │   ├── results/           # Ergebnisse (CRUD + Generate)
│   │   │   ├── result/[id]/       # Schaltplan-Generierung
│   │   │   ├── wizard/            # Wizard-Daten (Verbraucher-Kategorien)
│   │   │   └── admin/             # Admin-APIs (Produkte, Kategorien, etc.)
│   │   ├── actions/               # Next.js Server Actions
│   │   │   ├── results.ts         # Result CRUD Actions
│   │   │   ├── settings.ts        # KI-Einstellungen abrufen
│   │   │   ├── algorithm-settings.ts  # Algorithmus-Parameter abrufen
│   │   │   └── general-settings.ts    # Allgemeine Einstellungen (Amazon-Tag etc.)
│   │   └── layout.tsx             # Root-Layout (next-intl Provider)
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui Basis-Komponenten (Button, Card, Input...)
│   │   ├── wizard/                # Wizard-spezifische Komponenten
│   │   │   ├── wizard-wrapper.tsx # Wizard-Orchestrator & Schritt-Navigation
│   │   │   ├── steps/             # 8 Wizard-Schritt-Komponenten
│   │   │   └── device-search-modal.tsx  # Gerät-Suchmodal
│   │   ├── result/                # Ergebnis-Anzeige-Komponenten
│   │   │   ├── result-display.tsx # Haupt-Empfehlungsanzeige
│   │   │   ├── product-carousel.tsx  # Produkt-Karussell
│   │   │   └── result-summary-card.tsx  # Kurzübersicht (Ah, Wp, W)
│   │   ├── admin/                 # Admin-Panel-Komponenten
│   │   │   └── settings/          # Einstellungs-Formulare
│   │   └── marketing/             # Landing-Page-Komponenten
│   │
│   ├── lib/
│   │   ├── algorithm/             # Kern-Algorithmus
│   │   │   ├── algorithm.ts       # Hauptberechnungs-Engine (~2500 Zeilen)
│   │   │   ├── constants.ts       # Physik-Konstanten & Standard-Werte
│   │   │   ├── types.ts           # TypeScript-Interfaces
│   │   │   ├── adapter.ts         # WizardInput → AlgorithmInput Konvertierung
│   │   │   └── product-preselection.ts  # 2-stufiges Produkt-Scoring-System
│   │   ├── recommendation/        # Empfehlungs-Engine
│   │   │   ├── index.ts           # Orchestrator (Selection → Reasoning → Enrichment)
│   │   │   ├── types.ts           # Empfehlungs-Interfaces
│   │   │   ├── selection/         # Produkt-Auswahl (Algorithmus oder Hybrid-KI)
│   │   │   ├── reasoning/         # Begründungstexte (Templates oder KI)
│   │   │   └── utils/             # Produkt-Anreicherung (DB-Daten, Affiliate-Links)
│   │   ├── ai.ts                  # KI-Provider-Abstraktion (Google/OpenAI)
│   │   ├── format-for-ai.ts       # Prompt-Formatierung (FormData → Lesbarer Text)
│   │   ├── cable-calculator.ts    # Kabel-Querschnitts-Berechnung
│   │   ├── db.ts                  # Prisma-Client Singleton
│   │   ├── store/                 # Zustand State Stores
│   │   │   └── wizard-store.ts    # Wizard-Formular-State (persistent)
│   │   └── schemas/               # Zod-Validierungs-Schemas
│   │       ├── result.ts          # FormData-Schema
│   │       └── products.ts        # Produkt-Spec-Schema
│   │
│   ├── messages/                  # i18n-Übersetzungen (DE/EN)
│   └── middleware.ts              # HTTP Basic Auth für /admin-Routen
│
├── packages/                      # Lokale Packages
│   └── creatorsapi-nodejs-sdk/    # Amazon Creators API SDK (lokal)
│
├── check-settings.ts              # Diagnose-Skript für Einstellungen
├── repro_battery.ts               # Reproduktions-Skript für Batterie-Berechnungen
├── package.json
├── prisma.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## 4. Datenbankschema

### 4.1 Übersicht der Modelle

```
Result ─────────────── CreditBalance (1:1)
  └─────────────────── CreditUsage (1:N)

Product ──────────────── Category (N:1)
  └─────────────────── Brand (N:1)

Category ─────────────── CategoryFilter (1:N)
ConsumerCategory ────── ConsumerDevice (1:N)

Brand ─────────────────── (kein direkter Bezug zu BrandFilterCategory)
BrandFilterCategory ─── (eigenständig, Kategorien-Mapping für Wizard)

(Eigenständig): SystemSetting, ModelPricing, AlgorithmSettings, PromptVersion,
                CreditPurchase
```

### 4.2 Result
Speichert eine vollständige Nutzersitzung (Wizard → Berechnung → Empfehlungen).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `version` | Int | Optimistic-Locking-Versionszähler |
| `formData` | JSON | Vollständige Wizard-Eingaben |
| `calculations` | JSON? | Algorithmisch berechnete Systemanforderungen |
| `recommendations` | JSON? | Ausgewählte Produkte + Begründungen |
| `schematicData` | JSON? | Schaltplan-Metadaten |
| `pdfUrl` | String? | URL zum generierten Schaltplan-Bild (Vercel Blob) |
| `aiModel` | String? | Verwendetes KI-Modell |
| `inputTokens` | Int? | Verbrauchte Eingabe-Tokens |
| `outputTokens` | Int? | Verbrauchte Ausgabe-Tokens |
| `creditsUsed` | Int | Verbrauchte Credits (Schaltplan-Generierungen) |
| `expiresAt` | DateTime | Ablaufdatum (90 Tage nach Erstellung) |

### 4.3 Product
Produkt-Datenbank für Empfehlungen.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `name` | String | Produktname |
| `asin` | String? | Amazon Standard Identification Number |
| `affiliateUrl` | String? | Amazon-Affiliate-Link |
| `price` | Float? | Preis in EUR |
| `categoryId` | String | FK → Category |
| `specs` | String | JSONB-Spezifikationen (Zod-validiert) |
| `powerW` | Int? | Wechselrichter: Dauerleistung (W) |
| `capacityAh` | Int? | Batterie: Kapazität (Ah) |
| `voltageV` | Int? | Batterie: Spannung (12/24/48 V) |
| `batteryType` | String? | Batterietyp (lifepo4/agm/gel) |
| `currentA` | Int? | Ladestrom (A) |
| `crossSectionMm2` | Float? | Kabel-Querschnitt (mm²) |
| `solarWp` | Int? | Solarpanel: Leistung (Wp) |
| `supportedVoltages` | JSON? | Unterstützte Spannungen [12, 24, 48] |
| `maxDischargeA` | Int? | Batterie: Max. Entladestrom |
| `waveform` | String? | Wechselrichter: Sinusform |
| `filterValues` | JSON? | Dynamische Filter-Werte |
| `brandId` | String? | FK → Brand |
| `isActive` | Boolean | Sichtbarkeit |

### 4.4 Category / CategoryFilter
- **Category**: Produkt-Kategorien (Batterien, Wechselrichter, Solar-Laderegler etc.) mit `slug` und `sortOrder`
- **CategoryFilter**: Dynamische Filter-Definitionen pro Kategorie (name, key, type, unit, options). Ermöglicht flexibles Filter-UI ohne Code-Änderungen.

### 4.5 AlgorithmSettings
Konfigurierbare Berechnungsparameter (ein einziges `"default"` Record). Alle physikalischen Konstanten können überschrieben werden:
- DoD (Entladetiefe) für LiFePO4/AGM/GEL
- Sonnenstunden-Matrix (Sommer/Winter/Ganzjahr)
- Standort-Modifikatoren (Skandinavien, Süd-Europa etc.)
- Solar-Effizienzfaktoren (Dach-Orientierung, Nutzungsgrad)
- Batterie-/Solar-Sicherheitspuffer
- Produktauswahl-Modus (algorithm / hybrid)
- Begründungstext-Modus (algorithm / ai / none)

### 4.6 Brand / BrandFilterCategory
- **Brand**: Marken mit Typ-Zuordnung (`types[]`: CHARGER, BATTERY, SOLAR). Hat ein deprecated `type` Feld (Einzelwert).
- **BrandFilterCategory**: Wizard-seitige Kategorisierung von Marken (z.B. "CHARGER" → ["wechselrichter", "ladebooster", "batterieladegeraete"]).

### 4.7 CreditBalance / CreditUsage / CreditPurchase
Kreditbasiertes Zahlungssystem:
- **CreditBalance**: Aktuelles Guthaben pro Result (1:1)
- **CreditUsage**: Log-Einträge pro Schaltplan-Generierung
- **CreditPurchase**: PayPal-Transaktionsdaten (packageType: single/starter/pro)

### 4.8 Weitere Modelle
| Modell | Zweck |
|--------|-------|
| `ConsumerCategory` | Wizard-Geräte-Kategorien (Multimedia, Küche etc.) |
| `ConsumerDevice` | Einzelne Geräte mit Standardwerten für den Wizard |
| `SystemSetting` | Globaler Key-Value-Store (Amazon-Tag, API-Keys) |
| `ModelPricing` | KI-Modell-Preise (USD/1M Tokens) für Kosten-Tracking |
| `PromptVersion` | Versionierte KI-Prompts (System + User Template) |

---

## 5. Architektur-Überblick

```
┌─────────────────────────────────────────────────────────┐
│                    NUTZER-JOURNEY                        │
└─────────────────────────────────────────────────────────┘

  Landing Page → [8-Schritt-Wizard] → Ergebnis-Seite → Schaltplan
       ↓                ↓                   ↓               ↓
  Marketing        Zustand-Store        Produktkarten    DALL-E 3
  Komponenten      (Zustand)            (kostenlos)     (kostenpflichtig)

┌─────────────────────────────────────────────────────────┐
│                     API-SCHICHT                         │
└─────────────────────────────────────────────────────────┘

  POST /api/results                POST /api/results/[id]/generate
       ↓                                      ↓
  1. Zod-Validierung              1. Algorithmus-Neuberechnung
  2. Algorithmus-Berechnung       2. Produkt-Prefilterung (Spannung/Typ)
  3. Result in DB speichern       3. Produkt-Preselection (Match-Scores)
                                  4. Recommendation Engine
                                     ├─ Algorithmus-Selektion ODER
                                     └─ Hybrid-KI (Gemini/GPT)
                                  5. Begründungstexte
                                  6. Produkt-Anreicherung (DB + Affiliate)
                                  7. Result aktualisieren

┌─────────────────────────────────────────────────────────┐
│                  ALGORITHMUS-SCHICHT                    │
│             src/lib/algorithm/algorithm.ts              │
└─────────────────────────────────────────────────────────┘

  WizardInput
       ↓ adapter.ts (convertWizardInputToAlgorithmInput)
  AlgorithmInput
       ↓ algorithm.ts (calculateRequirements)
  AlgorithmOutput
       ↓ adapter.ts (convertToSystemRequirements)
  SystemRequirements (Legacy-Format für UI)

┌─────────────────────────────────────────────────────────┐
│                  EMPFEHLUNGS-SCHICHT                    │
│           src/lib/recommendation/index.ts               │
└─────────────────────────────────────────────────────────┘

  PreselectionResult + SystemRequirements
       ↓
  [1] SELEKTION:   algorithm-selector.ts ODER hybrid-selector.ts (KI)
       ↓
  [2] REASONING:   algorithm-reasoner.ts ODER ai-reasoner.ts
       ↓
  [3] ENRICHMENT:  product-enricher.ts (DB-Daten + Affiliate-Links)
       ↓
  EnrichedProduct[]
```

---

## 6. Algorithmus – Detaillierter Flow

Der Hauptalgorithmus (`src/lib/algorithm/algorithm.ts`) berechnet in 9 Phasen:

### Phase 1: Tagesverbrauch

```
Für jeden Verbraucher:
  - Normaler Verbraucher:   Wh = Leistung(W) × Stunden/Tag
  - Kompressor-Kühlschrank: Wh = Leistung × Stunden × 0.35 (Duty Cycle)
  - Absorber-Kühlschrank:   Wh = Leistung × Stunden × 0.7 × elektrischerAnteil
Summe = Gesamt-Tagesverbrauch (Wh)
```

### Phase 2: Solar-Dimensionierung

```
1. Max Dachkapazität (Wp) = Länge(m) × Breite(m) × Wp/m² × 0.80 × 0.85
2. Benötigte Wp = Tagesverbrauch ÷ (PSH × 0.85 Wirkungsgrad × 0.85 Orientierung)
3. Empfohlene Wp = Benötigte Wp × 1.20 Sicherheitspuffer
4. Tagesertrag = Dach-Wp × PSH × 0.85
5. Solar-Unterdeckung = max(0, Tagesverbrauch - Tagesertrag)

PSH-Matrix (Sonnenstunden/Tag):
  Sommer:   5.0h (Deutschland) / 6.5h (Süd-Europa) / 3.5h (Skandinavien)
  Ganzjahr: 3.5h / 4.5h / 2.5h
  Winter:   2.0h / 3.0h / 1.2h
```

### Phase 3: Ladebooster (Lichtmaschine)

```
Ausgangsstrom = (Fahrzeugspannung × 30A × 0.95) ÷ Systemspannung
Tagesladung   = Ausgangsstrom × Systemspannung × 2h ÷ Stehzeit-Tage
```

### Phase 4: Batterie-Dimensionierung

```
1. Schlechtwetter-Faktor: Sommer=0.50, Winter=0.20, Ganzjahr=0.30
2. Schlechtwetter-Solarertrag = Tagesertrag × Schlechtwetter-Faktor
3. Tägliches Defizit = max(0, Verbrauch - Schlechtwetter-Solar - Lichtmaschine)
4. Backup-Tage = min(Saison-Max, Reise-Max, Autarkie-Tage)
5. Rohkapazität (Wh) = Defizit × Backup-Tage
6. Puffer (Wh) = Rohkapazität × 1.20
7. Min-Kapazität (Ah) = Puffer ÷ (Spannung × DoD)
8. Nacht-Minimum = Tagesverbrauch × (14h/24h) × 1.20 ÷ (Spannung × DoD)
9. Endkapazität = max(Defizit-basiert, Nacht-basiert), aufgerundet auf 50 Ah
```

DoD-Werte: LiFePO4 = 95%, AGM = 50%, GEL = 50%

### Phase 5: Ladegerät (Landstrom)

```
Zielstrom = Kapazität(Ah) ÷ Ladezeit(h)
Ladezeit: Langsam=12h, Normal=8h, Schnell=5h
```

### Phase 6: Wechselrichter (230V-Verbraucher)

```
Spitzenlast = Max-Einzellast + (Gesamt-230V - Max-Einzellast) × Gleichzeitigkeitsfaktor
Gleichzeitigkeitsfaktoren: Niedrig=0.3, Mittel=0.5, Hoch=0.8
```

### Phase 7: Solar-Laderegler

```
Regler-Strom = Gesamt-Wp ÷ Systemspannung × 1.10 (Sicherheit)
Typ: Immer MPPT (PWM nicht empfohlen)
```

### Phase 8: Kabel-Dimensionierung

```
Formel: A(mm²) = (2 × Länge(m) × Strom(A)) ÷ (56 × Spannungsabfall%)
Spannungsabfall:
  Kritisch (Wechselrichter, Ladegerät, Booster-Eingang): 2%
  Normal (Solar, Sicherungskasten): 3%
Ampacity-Check: Kabel muss Strom physikalisch tragen können
```

### Phase 9: Adapter (Legacy-Format)

Die `convertToSystemRequirements()`-Funktion wandelt den `AlgorithmOutput` in das `SystemRequirements`-Format um, das von der UI verwendet wird.

---

## 7. API-Endpunkte

### 7.1 Öffentliche Endpunkte

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `GET` | `/api/wizard/consumers` | Wizard-Verbraucher-Kategorien mit Geräten |
| `POST` | `/api/results` | Neues Result erstellen (Wizard-Abschluss) |
| `GET` | `/api/results` | Alle nicht-abgelaufenen Results (max. 50) |
| `GET` | `/api/results/[id]` | Einzelnes Result mit CreditBalance |
| `PATCH` | `/api/results/[id]` | Result-Felder aktualisieren |
| `POST` | `/api/results/[id]/generate` | KI-Empfehlungen generieren |
| `POST` | `/api/result/[id]/schematic/generate` | Schaltplan per DALL-E 3 generieren |

**Stub-Endpunkte (nicht implementiert):**
- `POST /api/calculate`, `POST /api/schematic`, `POST /api/payments`

### 7.2 Admin-Endpunkte (HTTP Basic Auth)

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| `GET/POST` | `/api/admin/categories` | Kategorien auflisten / erstellen |
| `GET/PUT/DELETE` | `/api/admin/categories/[id]` | Kategorie verwalten |
| `GET/POST` | `/api/admin/categories/[id]/filters` | Kategorie-Filter verwalten |
| `GET/PUT/DELETE` | `/api/admin/categories/[id]/filters/[fId]` | Filter-Definition CRUD |
| `GET/POST` | `/api/admin/products` | Produkte auflisten (paginiert) / erstellen |
| `GET/PATCH/DELETE` | `/api/admin/products/[id]` | Produkt verwalten |
| `GET/POST` | `/api/admin/consumer-categories` | Verbraucher-Kategorien CRUD |
| `GET/PUT/DELETE` | `/api/admin/consumer-categories/[id]` | - |
| `GET/POST` | `/api/admin/consumer-devices` | Verbraucher-Geräte CRUD |
| `GET/PUT/DELETE` | `/api/admin/consumer-devices/[id]` | - |
| `POST` | `/api/admin/media/upload` | Bild zu Vercel Blob hochladen |
| `GET` | `/api/admin/migrate` | Bilder zu Vercel Blob migrieren |
| `POST` | `/api/admin/optimize-specs` | KI-gestützte Produkt-Spec-Optimierung |
| `POST` | `/api/admin/seed-filters` | Filter-Templates seeden |

---

## 8. Komponenten-Hierarchie

### 8.1 Wizard

```
WizardWrapper (wizard-wrapper.tsx)
  ├── ProgressSteps (UI)
  ├── Step1Voltage
  ├── Step2Energy
  ├── Step3Consumers
  │     └── DeviceSearchModal
  ├── Step4Travel
  ├── Step5Autarky
  ├── Step6Cabling
  ├── Step7Brands
  └── Step8Recommendation
        └── AlgorithmResultModal
              └── RecommendationAdjustmentInput
```

### 8.2 Ergebnis-Seite

```
ResultPage (result/[id]/page.tsx)
  └── ResultDisplay
        ├── ResultSummaryCard      # Kurzübersicht (Ah, Wp, W)
        ├── ProductCarousel[]      # Pro Kategorie: Swipeable Produktkarten
        ├── CableGrid              # Kabelempfehlungen-Tabelle
        ├── SolarBagSuggestion     # Portable Solar-Konfiguration
        ├── ResultJsonViewer       # Debug: Rohdaten-Ansicht
        └── ResultDebugModal       # Debug-Modal
```

### 8.3 Admin-Panel

```
AdminLayout (admin/layout.tsx)
  └── [Sidebar-Navigation]
        ├── AdminDashboard
        ├── ProductsPage         → ProductImportDialog, ProductUpdateDialog
        ├── CategoriesPage       → CategoryFilterBuilder
        ├── BrandsPage
        ├── MediaPage            → MediaUploadModal
        ├── ConsumerDevicesPage
        ├── ConsumerCategoriesPage
        ├── ResultsPage
        └── SettingsPage
              ├── AlgorithmSettingsForm
              ├── AISettingsForm
              └── AmazonSettingsForm
```

---

## 9. KI-Integration

### 9.1 Provider-Abstraktion (`src/lib/ai.ts`)

Zwei Einstiegspunkte:
- **`generateProductSelection()`**: JSON-strukturierte Produktauswahl (Gemini oder OpenAI)
- **`generateText()`**: Freie Texterzeugung für Begründungstexte

**Retry-Logik**: 3 Versuche mit exponentialem Backoff (2s, 4s, 8s) bei 429/5xx-Fehlern.

**Response-Parsing** (mehrere Formate unterstützt):
1. Neues Format: `{ productGroups: { [category]: [...] } }`
2. Altes Format: `{ selectedIds: ["uuid1", ...] }`
3. Fallback: UUID-Extraktion per Regex

### 9.2 Prompt-System

**Platzhalter im Prompt-Template:**
- `{{PROMPT_FORMAT}}` – Formatiertes Nutzerprofil (Fahrzeug, Verbraucher, Reiseverhalten)
- `{{PRODUCT_CONTEXT}}` – Alle verfügbaren Produkte als JSON
- `{{PRESELECTION}}` – Vorausgewählte Produkte mit Match-Scores
- `{{REQUIREMENTS}}` – Algorithmus-berechnete Systemanforderungen

**Prompt-Versionierung**: `PromptVersion`-Modell ermöglicht A/B-Testing ohne Redeployment.

### 9.3 Format-for-AI (`src/lib/format-for-ai.ts`)

Wandelt strukturierte `formData` in natürlichen deutschen Text um:
- Konvertiert Enum-Werte in lesbare Labels
- Erklärt Sonderfälle (Duty Cycles, Kühlmethoden, parallele Batterien)
- Gibt Dachabmessungen mit expliziten Modulfit-Warnungen aus
- Hebt Nutzer-Overrides prominent hervor

### 9.4 Empfehlungs-Modi (konfigurierbar via AlgorithmSettings)

| `productSelectionMode` | `reasonGenerationMode` | Verhalten |
|------------------------|------------------------|-----------|
| `algorithm` | `algorithm` | Vollständig deterministisch, kein KI-Aufruf |
| `algorithm` | `ai` | Produkte algorithmisch, Texte per KI |
| `hybrid` | `algorithm` | KI wählt Produkte, Templates erklären |
| `hybrid` | `ai` | Vollständig KI-gestützt |
| `algorithm` | `none` | Nur Produkte, keine Texte |

### 9.5 Schaltplan-Generierung

Exklusiv mit OpenAI DALL-E 3:
- Modell: `dall-e-3`
- Qualität: `hd`, 1024×1024 px, Style: `vivid`
- Upload zu Vercel Blob → permanente URL
- Fallback: Temporäre OpenAI-URL (läuft nach 1h ab)

---

## 10. Credit/Payment-System

**Pakete:**
| Paket | Credits | Preis |
|-------|---------|-------|
| Single | 1 | €4.99 |
| Starter | 3 | €9.99 |
| Pro | 10 | €24.99 |

**Flow:**
1. Nutzer schließt Wizard ab → Result erstellt (kostenlose Empfehlungen sichtbar)
2. "Schaltplan generieren" klicken → PayPal-Checkout
3. PayPal-Order bestätigt → Credits zu Result hinzugefügt
4. 1 Credit pro Schaltplan-Generierung abgezogen
5. Regenerierung möglich, solange Credits vorhanden
6. Results laufen nach 90 Tagen ab

**Hinweis**: Der PayPal-Flow ist größtenteils als Stub implementiert (`CreditPurchase`-Modell vorhanden, aber `/api/payments` nicht implementiert).

---

## 11. Produkt-Preselection-System

Zweistufiges System zur Produktfilterung vor KI-Übergabe:

**Stufe 1: Harte Filter** (`preFilterProducts()`)
- Batterien: Spannung + Chemie müssen exakt passen
- Wechselrichter: Nur reiner Sinus (pure_sine)
- Ladegeräte/Booster/Laderegler: Systemspannung muss in `supportedVoltages` enthalten sein

**Stufe 2: Match-Score-Berechnung** (`preselectProducts()`)
- Jedes kompatible Produkt erhält Score 0–100 basierend auf Spez-Übereinstimmung
- Score-Schwellenwert konfigurierbar via `AlgorithmSettings.minPreselectionScore` (Standard: 30)
- Ergebnis: Pro Kategorie eine sortierte Liste von Kandidaten mit Scores und Gründen

**Zweck**: Reduktion der Token-Kosten und Verbesserung der KI-Qualität durch Fokussierung auf passende Produkte.

---

## 12. Konfigurierbare Algorithmus-Parameter

Alle Parameter können über das Admin-Panel unter `/admin/settings` angepasst werden, ohne Code-Änderungen:

| Kategorie | Parameter | Standard-Wert |
|-----------|-----------|---------------|
| Batterie | DoD LiFePO4 | 95% |
| Batterie | DoD AGM/GEL | 50% |
| Batterie | Sicherheitspuffer | 120% |
| Solar | Wp/m² (Starr) | 180 Wp/m² |
| Solar | Wp/m² (Flexibel) | 150 Wp/m² |
| Solar | Dach-Orientierungsfaktor | 85% |
| Solar | System-Wirkungsgrad | (hardcoded 85%) |
| Solar | Empf. Dimensionierungsfaktor | 120% |
| Sonnenstunden | Sommer D-A-CH | 5.0h |
| Sonnenstunden | Ganzjahr D-A-CH | 3.5h |
| Sonnenstunden | Winter D-A-CH | 2.0h |
| Standort | Modifikator Skandinavien | 0.6× |
| Standort | Modifikator Süd-Europa | 1.2× |
| Booster | Standard Lichtmaschinen-Strom | 30A |
| Ladegerät | Ladezeit Normal | 8h |
| Gleichzeitigkeit | Niedrig/Mittel/Hoch | 0.3/0.5/0.8 |
| Kabel | Spannungsabfall Kritisch | 2% |
| Kabel | Spannungsabfall Normal | 3% |

---

## 13. Architektur-Entscheidungen

1. **JSONB für flexible Daten**: `formData`, `calculations`, `recommendations` werden als JSON gespeichert. Ermöglicht Schema-Evolution ohne Migrationen.

2. **Hybrid-Modus**: Trennung von Produkt-Selektion und Begründungstexten ermöglicht kostengünstige Konfigurationen (z.B. Algorithmus-Selektion mit KI-Texten).

3. **Prompt-Versionierung**: `PromptVersion`-Modell erlaubt A/B-Testing verschiedener KI-Prompts in der Produktion.

4. **Legacy-Adapter-Pattern**: `adapter.ts` wandelt neues `AlgorithmOutput` in altes `SystemRequirements`-Format um. Ermöglicht UI-Kompatibilität ohne UI-Änderungen bei Algorithmus-Refactoring.

5. **Konfigurierbare Physik-Konstanten**: Alle Algorithmus-Parameter in `AlgorithmSettings` (DB) überschreibbar – ermöglicht Fine-Tuning ohne Code-Deployment.

6. **90-Tage-Expiry**: Erzwingt frische Berechnungen, verhindert veraltete Empfehlungen und knüpft Credits an den Result-Lebenszyklus.

7. **Kontoloser Ansatz**: Kein User-Authentifizierungssystem – Zugriffssteuerung nur über Result-ID. Senkt Einstiegshürde für Nutzer.

8. **Pre-Filtering vor KI**: 2-stufiges Filter-System reduziert Token-Verbrauch und verbessert KI-Treffsicherheit durch kontextualisierte Produkt-Listen.

---

*Dokumentation generiert durch automatischen Code-Review. Stand: 2026-04-10*
