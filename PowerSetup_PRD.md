# PowerSetup – Product Requirements Document (PRD)

## 1. Vision & Ziel

PowerSetup ist eine mobile-first Web-App, die **absolute Camping- und Elektrik-Anfänger** dabei unterstützt, ein **vollständiges, sicheres und normnahes Strom-Setup** für Fahrzeuge (Camper, Wohnmobile, Wohnwagen), Boote und weitere mobile/semistationäre Einheiten zu planen.

Der Nutzer beantwortet ein **extrem einfaches, visuell geführtes Multi-Step-Formular**.  
Am Ende erhält er:
- eine **vollständige Einkaufsliste** (Affiliate)
- einen **PDF-Schaltplan** (gegen Credits)
- klare **Warnhinweise & Haftungsausschlüsse**

---

## 2. Zielgruppe

- Absolute Anfänger ohne Elektrik-Kenntnisse
- Mobile-first (80–90 % Nutzung)
- EU-Fokus (Normen, Sprache, Haftung)

---

## 3. Supported Setups (v1 – vollständig)

### Fahrzeugtypen
- Campervan
- Wohnmobil
- Wohnwagen
- Boot
- Offroad / Expeditionsfahrzeuge

### Energiequellen
- Bordbatterien (AGM, Gel, Lithium)
- Solar
- Lichtmaschine (Ladebooster)
- Landstrom (230V)
- Generator

### Verbraucher
- Beleuchtung
- Kühlgeräte
- Heizung
- Wasserpumpe
- Ladegeräte (USB, 12V)
- Wechselrichter / 230V-Verbraucher
- Vordefinierte + optionale Zusatzgeräte

---

## 4. User Flow (High-Level)

1. Landing Page (Erklärung + CTA)
2. Multi-Step Formular (adaptiv)
3. Ergebnis-Seite:
   - Produktempfehlungen (kostenlos)
   - Verbrauchsübersicht (kostenlos)
   - CTA: „Schaltplan als PDF generieren"
4. Credit-Kauf (PayPal)
5. PDF-Generierung (Server-Side via Puppeteer)
6. Download + optionales Teilen (Share-Buttons)
7. Ergebnis über persistente URL abrufbar (90 Tage gültig)

---

## 5. Multi-Step Formular – UX & Anforderungen

### Design-Prinzipien
- **Mobile-first** (80-90% der Nutzer)
- **Zero-Keyboard**: So wenig Tastatureingaben wie möglich
- **Touch-optimiert**: Min. 48x48px Tap-Targets
- **Selbsterklärend**: Icons + kurze Labels
- **Single-Column Layout**: Keine horizontale Navigation
- **Fortschrittsanzeige**: Visueller Step-Indicator

---

### Unterstützte HTML5 Input-Typen (Browser-Support 2024)

| Input-Typ | Beschreibung | Browser-Support | Mobile-Vorteil |
|-----------|--------------|-----------------|----------------|
| `radio` | Einzelauswahl | ✅ Alle | Große Touch-Buttons |
| `checkbox` | Mehrfachauswahl | ✅ Alle | Große Touch-Buttons |
| `range` | Slider | ✅ Alle | Keine Tastatur nötig |
| `number` | Numerische Eingabe | ✅ Alle | Numerisches Keyboard |
| `select` | Dropdown | ✅ Alle | Native Picker auf Mobile |
| `button` | Toggle-Buttons | ✅ Alle | Visuelle Auswahl |

> ⚠️ **Vermeiden**: `text`, `textarea` – erfordern Tastatureingabe

---

### Formular-Schritte (Detailliert)

#### Schritt 1: Fahrzeugtyp
**Input**: Icon-Buttons (Radio-Verhalten)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Campervan | 🚐 | Kastenwagen, VW Bus |
| Wohnmobil | 🚙 | Integriert, Teilintegriert |
| Wohnwagen | 🏕️ | Caravan, Anhänger |
| Boot | ⛵ | Segelboot, Motorboot |
| Offroad | 🚗 | Geländewagen, Expedition |

**UX**: Große Kacheln mit Icon + Text, 1 Auswahl möglich

---

#### Schritt 2: Systemspannung
**Input**: Segmented Control (Radio-Buttons als Pills)

| Option | Beschreibung |
|--------|--------------|
| 12V | Standard PKW/Camper |
| 24V | LKW, große Boote |

**UX**: 2-Button Toggle, Default = 12V

---

#### Schritt 3: Energiequellen
**Input**: Icon-Checkboxen (Mehrfachauswahl)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Bordbatterie | 🔋 | Zusätzliche Batterie |
| Solar | ☀️ | Solarmodule |
| Lichtmaschine | ⚡ | Ladebooster während Fahrt |
| Landstrom | 🔌 | 230V Campingplatz |
| Generator | ⛽ | Mobiler Generator |

**UX**: Kacheln mit Icon, mehrere wählbar, mindestens 1 Pflicht

---

#### Schritt 4: Verbraucher auswählen
**Input**: Icon-Checkboxen mit Kategorien

**Gruppe: Basis**
| Verbraucher | Icon | Typisch Watt |
|-------------|------|--------------|
| Beleuchtung | 💡 | 5-50W |
| USB-Ladegeräte | 📱 | 10-30W |
| 12V-Steckdosen | 🔌 | variabel |

**Gruppe: Küche**
| Verbraucher | Icon | Typisch Watt |
|-------------|------|--------------|
| Kompressor-Kühlbox | ❄️ | 30-60W |
| Absorber-Kühlschrank | 🧊 | 80-150W |
| Kaffeemaschine | ☕ | 800-1500W |

**Gruppe: Komfort**
| Verbraucher | Icon | Typisch Watt |
|-------------|------|--------------|
| Standheizung | 🔥 | 10-40W |
| Wasserpumpe | 💧 | 30-60W |
| Lüfter/Ventilator | 🌀 | 5-30W |

**Gruppe: Entertainment**
| Verbraucher | Icon | Typisch Watt |
|-------------|------|--------------|
| Laptop | 💻 | 30-90W |
| TV/Monitor | 📺 | 30-100W |
| Spielkonsole | 🎮 | 50-200W |

**Gruppe: Werkzeug (optional)**
| Verbraucher | Icon | Typisch Watt |
|-------------|------|--------------|
| Bohrmaschine | 🔧 | 300-800W |
| Winkelschleifer | ⚙️ | 500-1200W |

**UX**: Kategorien als Akkordeon/Tabs, Icons prominent

---

#### Schritt 5: Nutzungsintensität
**Input**: Preset-Buttons + optionaler Range-Slider

Für jeden gewählten Verbraucher:

| Preset | Icon | Bedeutung |
|--------|------|-----------|
| Wenig | 🌙 | 1-2h/Tag |
| Normal | ☀️ | 3-5h/Tag |
| Viel | 🔆 | 6-12h/Tag |
| Dauerbetrieb | ♾️ | 24/7 (z.B. Kühlschrank) |

**Alternative**: Range-Slider (0-24h) für Poweruser

**UX**: Presets als Standard, Slider nur bei Tap auf "Erweitert"

---

#### Schritt 6: Autarkie-Ziel
**Input**: Segmented Control + Range-Slider

| Option | Beschreibung |
|--------|--------------|
| Wochenende | 2-3 Tage ohne Nachladen |
| Urlaubsreise | 5-7 Tage |
| Vollautark | 14+ Tage |

**Zusatz**: Range-Slider für exakte Tagesanzahl (1-30)

**UX**: Presets prominent, Slider für Feineinstellung

---

#### Schritt 7: Komfort-Level (Produktqualität)
**Input**: Card-Selection (Radio)

| Level | Icon | Beschreibung | Preisklasse |
|-------|------|--------------|-------------|
| Budget | 💰 | Funktional, günstig | € |
| Standard | ⭐ | Gutes Preis-Leistung | €€ |
| Premium | 👑 | Hochwertig, langlebig | €€€ |

**UX**: 3 große Karten mit Icon, Beschreibung, Preisindikator

---

#### Schritt 8: Schaltplan-Präferenz
**Input**: Card-Selection (Radio)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Vereinfacht | 🎨 | Bunte Icons, leicht verständlich |
| Technisch | 📐 | Normgerecht, DIN-Symbole |

**UX**: 2 Karten mit Vorschau-Bild des jeweiligen Stils

---

### Optionale Zusatzfragen

#### Batterietyp-Präferenz (wenn Bordbatterie gewählt)
**Input**: Card-Selection (Radio)

| Option | Icon | Pro | Contra |
|--------|------|-----|--------|
| AGM | 🔋 | Günstig, robust | Schwer, weniger Zyklen |
| LiFePO4 | ⚡ | Leicht, langlebig | Teuer |
| Egal | 🤷 | KI entscheidet | - |

---

### UI-Komponenten-Spezifikation

#### Icon-Button (Radio/Checkbox)
```
┌─────────────────────┐
│        🚐          │  ← Icon (32-48px)
│     Campervan       │  ← Label
│  Kastenwagen, VW    │  ← Sublabel (optional)
└─────────────────────┘
Min. 80x80px Touch-Target
```

#### Preset-Slider Hybrid
```
┌───────┬───────┬───────┬───────┐
│ Wenig │Normal │ Viel  │Dauer  │  ← Preset Buttons
└───────┴───────┴───────┴───────┘
     ●━━━━━━━━━━━━━━━━━━●        ← Range Slider (optional)
     0h                24h
```

#### Segmented Control
```
┌─────────────┬─────────────┐
│     12V     │     24V     │
│   (aktiv)   │             │
└─────────────┴─────────────┘
```

---

### Fortschrittsanzeige
```
Step 1    Step 2    Step 3    Step 4    Step 5    Step 6    Step 7    Step 8
  ●─────────●─────────●─────────○─────────○─────────○─────────○─────────○
Fahrzeug  Spannung  Energie  Verbraucher  ...
```

**UX**: Klickbar für Navigation, abgeschlossene Schritte editierbar

---

⚠️ **Keine Live-Berechnung sichtbar im MVP** – Ergebnis erst nach Abschluss

---

## 6. Ergebnis (kostenlos)

### Produktempfehlung
- Kategorisiert (Batterie, Solar, Sicherungen, Kabel, etc.)
- Max. 2–3 Alternativen pro Kategorie
- Affiliate-Link (Amazon)

### Verbrauchszusammenfassung
- Täglicher Verbrauch (vereinfacht)
- Empfohlene Kapazitäten (ohne technische Tiefe)


---

## 7. KI-Komponente

### Aufgaben der KI
- Dimensionierung (Ah, W, Kabelquerschnitt, Sicherungen)
- Produktauswahl (aus Admin-Datenpool)
- Normnahe Struktur
- Laienverständliche Erklärung
- **Strukturierte Schaltplan-Daten (JSON)**

### Architektur (Token-optimiert)
```
1. User Formular
   ↓
2. Regelbasierte Produkt-Vorfilterung (kein KI-Aufruf)
   - Spannung, Kategorie, Kompatibilität
   → Reduziert auf ~20-50 Produkte
   ↓
3. Scoring/Ranking (Preis-Leistung, Verfügbarkeit)
   → Top 3-5 pro Kategorie
   ↓
4. KI-Aufruf mit reduzierten Produkten (~15-30 total)
   - Generiert Schaltplan-Daten
   - Erklärt Auswahl
   ↓
5. Bei Kauf: Puppeteer → PDF-Export
```

### Provider
- **Primär**: Google Gemini
- **Fallback**: OpenAI API
- Prompt-Versionierung

---

## 8. Schaltplan

### Eigenschaften
- **Export**: PDF via Puppeteer (Server-Side)
- Downloadbar nach Kauf

### Varianten
- Normnah (DIN/ISO, Farbcodes)
- Vereinfachte Darstellung (Laien)

### Inhalt
- Alle Komponenten
- Kabel
- Sicherungen
- Energieflüsse
- Warnhinweise

---

## 9. Credit-System

### Flow
1. User füllt Formular aus → Ergebnis-ID wird generiert
2. Kostenlos sichtbar: Produktliste + Verbrauchsübersicht
3. User kauft Credits für PDF-Generierung
4. **Eingaben ändern = kostenlos**
5. **Neue PDF-Generierung = kostet erneut Credits**

### Pakete
| Paket | Credits | Preis |
|-------|---------|-------|
| Einzel | 1 Schaltplan | 4,99 € |
| Starter | 3 Schaltpläne | 9,99 € |
| Pro | 10 Schaltpläne | 24,99 € |

### Technisch
- Credits accountlos, gebunden an Ergebnis-ID
- PayPal-Integration (später erweiterbar)

---

## 10. Ergebnis-Speicherung & URLs

### Persistente Einmal-URL
```
https://powersetup.de/result/{uuid}?v={version}
```

### Was wird gespeichert?
- Alle Formular-Eingaben
- Berechnete Werte
- Produktempfehlungen
- Schaltplan-JSON
- PDF-Download-Link (wenn gekauft)

### User kann:
- URL speichern & teilen
- Eingaben nachträglich verfeinern → neue Version (`?v=2`)

### Gültigkeit
- 90 Tage
- Hard Delete nach Ablauf

---

## 11. Admin Dashboard

### Funktionen
- Produktverwaltung
- Regeldefinition
- Kategorie-Management
- Affiliate-Link-Verwaltung

### Produkt-Datenmodell (JSONB mit Zod-Validierung)

#### Schema-Versionierung
- `specVersion` Feld in jedem Produkt
- Ermöglicht Migration bei Schema-Änderungen

#### Kategorien & Felder

**Batterien (AGM, Gel, Lithium)**
```json
{
  "type": "LiFePO4",
  "voltage": 12,
  "capacity": 100,
  "maxChargeCurrent": 50,
  "maxDischargeCurrent": 100,
  "cycleLife": 3000,
  "weight": 12.5,
  "dimensions": { "l": 330, "b": 173, "h": 212 },
  "bmsIncluded": true
}
```

**Wechselrichter**
```json
{
  "inputVoltage": [12],
  "outputVoltage": 230,
  "continuousPower": 2000,
  "peakPower": 4000,
  "waveform": "pure_sine",
  "efficiency": 93,
  "noLoadConsumption": 12
}
```

**Solarladeregler (MPPT/PWM)**
```json
{
  "type": "MPPT",
  "maxInputVoltage": 100,
  "maxChargeCurrent": 30,
  "maxPvPower": 400,
  "batteryVoltages": [12, 24],
  "batteryTypes": ["AGM", "Gel", "LiFePO4"]
}
```

**Ladebooster (B2B)**
```json
{
  "inputVoltage": 12,
  "outputVoltage": 12,
  "maxChargeCurrent": 30,
  "batteryTypes": ["AGM", "Gel", "LiFePO4"],
  "dPlusActivation": true
}
```

**Solarmodule**
```json
{
  "type": "mono",
  "power": 200,
  "vmp": 18.5,
  "imp": 10.8,
  "voc": 22.3,
  "isc": 11.2,
  "dimensions": { "l": 1580, "b": 808, "h": 35 },
  "flexible": false
}
```

**Sicherungen**
```json
{
  "type": "midi",
  "rating": 60,
  "voltage": 32
}
```

---

## 12. Datenhaltung

### Ergebnis-Speicherung
- Keine User-Accounts
- Einmal-ID (UUID)
- Gültigkeit: 90 Tage
- Versionierung (`?v=1`)
- Hard Delete nach Ablauf

### DSGVO
- Kein Tracking ohne Consent
- E-Mail-Versand nicht im MVP
- Löschroutine nach 90 Tagen

---

## 13. Internationalisierung

- DE / EN (i18n)
- Texte KI-seitig sprachabhängig

---

## 14. Recht & Sicherheit

- Klarer Haftungsausschluss
- Warnhinweise bei 230V
- Empfehlung Fachbetrieb
- EU-Normen berücksichtigt, aber keine Garantie

---

## 15. Tech Stack

### Frontend
- **Next.js 16.1**
- TypeScript
- TailwindCSS
- i18n

### Backend
- API Routes / Server Actions
- PostgreSQL
- Prisma ORM
- JSONB + Zod für Produktdaten
- Puppeteer (PDF-Generierung)

### KI
- Google Gemini (primär)
- OpenAI API (Fallback)
- Prompt-Versionierung

### Hosting
- **Vercel**

### Zahlung
- **PayPal** (MVP, später erweiterbar)

---

## 16. MVP Scope

### ✅ Im MVP enthalten
- Multi-Step Formular
- Produktempfehlungen (kostenlos)
- PDF-Generierung (kostenpflichtig)
- PayPal-Zahlung mit Credit-Paketen
- Persistente URLs mit Versionierung
- Simple Share-Buttons (WhatsApp, Copy Link)
- Alle Fahrzeugtypen inkl. Boot

### ❌ Nicht im MVP
- User Accounts
- Manuelle Schaltplan-Editoren
- E-Mail-Versand
- Community-Features

---

## 17. Zukunft (Out of Scope v1)

- User Accounts
- Manuelle Schaltplan-Editoren
- Community / Teilen (erweitert)
- Händler-White-Label
- Stripe/Kreditkarten-Zahlung
- E-Mail-Benachrichtigungen

---

## 18. Erfolgskriterien

- Formular Completion Rate > 70 %
- Conversion zu Schaltplan > 10 %
- Affiliate CTR > 15 %
