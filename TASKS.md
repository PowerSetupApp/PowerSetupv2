# PowerSetup – Entwicklungs-Tasks

> **📖 Anleitung für KI:**  
> Vor dem Ausführen eines Tasks die unter **"Lies zuerst"** verlinkten PRD-Dateien öffnen und vollständig lesen!
> 
> **Beispiel-Befehl:** "Setze Punkt 3 um"

---

## ✅ Punkt 1: Next.js Projekt initialisieren *(erledigt)*

**Lies zuerst:**
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – Tech Stack Übersicht, Ordnerstruktur

**Was zu tun ist:**
1. Next.js 16.1 Projekt mit TypeScript erstellen (`npx create-next-app@latest`)
2. TailwindCSS aktivieren
3. App Router verwenden
4. Ordnerstruktur gemäß PRD anlegen:
   ```
   app/
     (marketing)/
     wizard/[[...step]]/
     result/[id]/
     api/
   components/ui/, wizard/, result/
   lib/
   prisma/
   ```
5. shadcn/ui initialisieren
6. ESLint + Prettier konfigurieren

**Erfolgskriterium:** `npm run dev` startet ohne Fehler

---

## ✅ Punkt 2: Datenbank & Prisma einrichten *(erledigt)*

**Lies zuerst:**
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Prisma Schema, alle Models
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – PostgreSQL Setup

**Was zu tun ist:**
1. PostgreSQL-Datenbank erstellen (Vercel Postgres oder Neon)
2. Prisma installieren: `npm install prisma @prisma/client`
3. `prisma/schema.prisma` erstellen mit allen Models:
   - Result
   - Product
   - Category
   - CreditPurchase
   - CreditBalance
   - CreditUsage
   - PromptVersion
4. Erste Migration ausführen: `npx prisma migrate dev`
5. Prisma Client generieren

**Erfolgskriterium:** `npx prisma studio` zeigt alle Tabellen

---

## ✅ Punkt 3: Zod-Schemas für Produkte erstellen *(erledigt)*

**Lies zuerst:**
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Alle Zod-Schemas im Abschnitt "Produkt-Spezifikationen"

**Was zu tun ist:**
1. Datei `lib/schemas/products.ts` erstellen
2. Alle Produkt-Schemas implementieren:
   - BaseProductSpec
   - BatterySpec
   - InverterSpec
   - ChargeControllerSpec
   - BoosterSpec
   - SolarPanelSpec
   - FuseSpec
   - CableSpec
3. TypeScript-Typen ableiten (`z.infer<typeof Schema>`)
4. Validierungsfunktionen exportieren

**Erfolgskriterium:** Alle Schemas kompilieren ohne TypeScript-Fehler

---

## ✅ Punkt 4: Basis UI-Komponenten erstellen *(erledigt)*

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – UI-Komponenten Spezifikation

**Was zu tun ist:**
1. `components/ui/icon-button.tsx` – Radio/Checkbox mit Icon (80x80px Touch-Target)
2. `components/ui/segmented-control.tsx` – 12V/24V Toggle
3. `components/ui/preset-slider.tsx` – Preset-Buttons + Range-Slider Hybrid
4. `components/ui/card-selection.tsx` – Große Auswahlkarten
5. `components/ui/progress-steps.tsx` – Fortschrittsanzeige (8 Schritte)

**Design-Regeln:**
- Min. 48x48px Tap-Targets
- Mobile-first
- Touch-optimiert

**Erfolgskriterium:** Alle Komponenten in Storybook oder Test-Seite sichtbar

---

## ☐ Punkt 5: Wizard-Layout & Navigation

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Design-Prinzipien, Fortschrittsanzeige
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – URL-Routing

**Was zu tun ist:**
1. `app/wizard/[[...step]]/page.tsx` erstellen
2. Layout mit Fortschrittsanzeige oben
3. URL-basierte Step-Navigation (`/wizard/1`, `/wizard/2`, ...)
4. Zurück/Weiter Buttons
5. React Hook Form + Zustand für Formular-State
6. Single-Column Layout, Mobile-first

**Erfolgskriterium:** Navigation zwischen Steps funktioniert, State bleibt erhalten

---

## ☐ Punkt 6: Formular Schritt 1-3 (Fahrzeug, Spannung, Energie)

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Schritt 1, 2, 3 Details

**Was zu tun ist:**

**Schritt 1 – Fahrzeugtyp:**
- 5 Icon-Buttons: Campervan 🚐, Wohnmobil 🚙, Wohnwagen 🏕️, Boot ⛵, Offroad 🚗
- Radio-Verhalten (1 Auswahl)

**Schritt 2 – Systemspannung:**
- Segmented Control: 12V / 24V
- Default: 12V

**Schritt 3 – Energiequellen:**
- 5 Icon-Checkboxen: Bordbatterie 🔋, Solar ☀️, Lichtmaschine ⚡, Landstrom 🔌, Generator ⛽
- Mehrfachauswahl, min. 1 Pflicht

**Erfolgskriterium:** Alle 3 Schritte funktional, Validierung aktiv

---

## ☐ Punkt 7: Formular Schritt 4 (Verbraucher)

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Schritt 4: Verbraucher mit allen Kategorien

**Was zu tun ist:**
1. Akkordeon oder Tabs für 5 Kategorien:
   - Basis (Beleuchtung, USB, 12V-Steckdosen)
   - Küche (Kühlbox, Kühlschrank, Kaffeemaschine)
   - Komfort (Heizung, Wasserpumpe, Lüfter)
   - Entertainment (Laptop, TV, Konsole)
   - Werkzeug (Bohrmaschine, Winkelschleifer)
2. Icon-Checkboxen mit Watt-Angaben
3. Mehrfachauswahl pro Kategorie

**Erfolgskriterium:** Alle Verbraucher wählbar, Icons korrekt

---

## ☐ Punkt 8: Formular Schritt 5-6 (Nutzung, Autarkie)

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Schritt 5 und 6

**Was zu tun ist:**

**Schritt 5 – Nutzungsintensität:**
- Pro gewähltem Verbraucher: Preset-Buttons (Wenig 🌙, Normal ☀️, Viel 🔆, Dauer ♾️)
- Optional: Range-Slider bei "Erweitert"

**Schritt 6 – Autarkie-Ziel:**
- Preset-Buttons: Wochenende, Urlaubsreise, Vollautark
- Range-Slider für 1-30 Tage

**Erfolgskriterium:** Nutzung für jeden Verbraucher einstellbar

---

## ☐ Punkt 9: Formular Schritt 7-8 (Komfort, Schaltplan-Stil)

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Schritt 7, 8, optionale Zusatzfragen

**Was zu tun ist:**

**Schritt 7 – Komfort-Level:**
- 3 Card-Selections: Budget 💰, Standard ⭐, Premium 👑
- Preisindikator (€, €€, €€€)

**Schritt 8 – Schaltplan-Präferenz:**
- 2 Card-Selections: Vereinfacht 🎨, Technisch 📐
- Mit Vorschau-Bild

**Optional – Batterietyp:**
- Wenn Bordbatterie gewählt: AGM, LiFePO4, Egal

**Erfolgskriterium:** Formular komplett durchspielbar

---

## ☐ Punkt 10: Result-API (CRUD)

**Lies zuerst:**
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Result Model, Daten-Lifecycle
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – API Routes

**Was zu tun ist:**
1. `app/api/results/route.ts` – POST (erstellen)
2. `app/api/results/[id]/route.ts` – GET, PATCH
3. UUID-Generierung für neue Results
4. expiresAt = createdAt + 90 Tage setzen
5. Versionierung bei Updates (version++)
6. formData, calculations, recommendations als JSONB

**Erfolgskriterium:** Result erstellen, abrufen, aktualisieren funktioniert

---

## ☐ Punkt 11: Produkt-Vorfilterung (Regelbasiert)

**Lies zuerst:**
- [PRD_03_KI_Schaltplan.md](./docs/PRD_03_KI_Schaltplan.md) – Vorfilterung (Regelbasiert)
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Product Schema

**Was zu tun ist:**
1. `lib/products/filter.ts` erstellen
2. Spannungsfilter: nur 12V oder 24V passend
3. Kategoriefilter: nur relevante Kategorien (z.B. Solar → solar_panel, charge_controller)
4. Kompatibilitätsfilter: Batterietyp-Match
5. Scoring/Ranking: Top 3-5 pro Kategorie
6. Ziel: ~15-30 Produkte für KI-Aufruf

**Erfolgskriterium:** Filterung reduziert Produkte korrekt

---

## ☐ Punkt 12: KI-Integration (Gemini)

**Lies zuerst:**
- [PRD_03_KI_Schaltplan.md](./docs/PRD_03_KI_Schaltplan.md) – KI-Prompt-Struktur, erwartete Antwort
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – Gemini/OpenAI Code

**Was zu tun ist:**
1. `lib/ai.ts` erstellen
2. Gemini API-Client einrichten
3. System-Prompt aus PRD implementieren
4. User-Prompt-Template mit Formular-Daten + gefilterten Produkten
5. JSON-Response-Parsing (selectedProducts, calculations, schematic, warnings)
6. OpenAI-Fallback bei Gemini-Fehlern

**Erfolgskriterium:** KI generiert strukturierte Antwort im JSON-Format

---

## ☐ Punkt 13: PDF-Generierung (Puppeteer)

**Lies zuerst:**
- [PRD_03_KI_Schaltplan.md](./docs/PRD_03_KI_Schaltplan.md) – PDF-Generierung, Inhalt
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – Puppeteer Code

**Was zu tun ist:**
1. `lib/pdf.ts` erstellen
2. Puppeteer + @sparticuz/chromium für Vercel
3. PDF-Template erstellen (HTML/React):
   - Deckblatt (Logo, Fahrzeugtyp, Datum, Disclaimer)
   - Übersicht (Verbrauch, Key Facts)
   - Schaltplan (vereinfacht oder technisch)
   - Produktliste mit Affiliate-Links + QR-Codes
   - Warnhinweise
4. Vercel Blob Storage für PDF-Speicherung

**Erfolgskriterium:** PDF wird generiert und im Blob gespeichert

---

## ☐ Punkt 14: Ergebnis-Seite

**Lies zuerst:**
- [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) – Ergebnis-Seite (kostenlos)
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – User Flow

**Was zu tun ist:**
1. `app/result/[id]/page.tsx` erstellen
2. Produktempfehlungen kategorisiert anzeigen
3. Affiliate-Links zu Amazon
4. Verbrauchszusammenfassung
5. Share-Buttons (WhatsApp, Copy Link)
6. CTA: "Schaltplan als PDF generieren"

**Erfolgskriterium:** Ergebnis-Seite zeigt alle Daten korrekt

---

## ☐ Punkt 15: PayPal-Integration

**Lies zuerst:**
- [PRD_04_Credit_System.md](./docs/PRD_04_Credit_System.md) – PayPal-Integration, API-Endpunkte
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – Umgebungsvariablen

**Was zu tun ist:**
1. PayPal Developer Account einrichten
2. `lib/paypal.ts` erstellen
3. `app/api/payments/create-order/route.ts`
4. `app/api/payments/capture-order/route.ts`
5. `app/api/webhooks/paypal/route.ts`
6. Webhook-Signatur verifizieren
7. Credits nach erfolgreicher Zahlung gutschreiben

**Erfolgskriterium:** Testkauf mit PayPal Sandbox erfolgreich

---

## ☐ Punkt 16: Credit-System

**Lies zuerst:**
- [PRD_04_Credit_System.md](./docs/PRD_04_Credit_System.md) – Credit-Flow, Datenmodell, UI

**Was zu tun ist:**
1. CreditBalance-Logik (pro Ergebnis-ID)
2. CreditUsage-Tracking bei PDF-Generierung
3. Paket-Auswahl UI (Einzel, Starter, Pro)
4. Credits-Anzeige nach Kauf
5. Validierung: Genug Credits vor PDF-Generierung?
6. Credit-Abzug nach erfolgreicher Generierung

**Erfolgskriterium:** Kauf → Credits → PDF-Download funktioniert

---

## ☐ Punkt 17: Admin Dashboard (Basis)

**Lies zuerst:**
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – MVP Scope
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Product, Category Models

**Was zu tun ist:**
1. `app/admin/` Route mit Basic Auth
2. Dashboard-Übersicht
3. Produkt-Liste mit Filtern
4. Produkt erstellen/bearbeiten
5. JSONB-Specs-Editor mit Zod-Validierung
6. Kategorie-Verwaltung
7. Affiliate-Link-Verwaltung

**Erfolgskriterium:** Produkte können im Admin angelegt werden

---

## ☐ Punkt 18: Landing Page

**Lies zuerst:**
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – Vision, Zielgruppe, User Flow

**Was zu tun ist:**
1. `app/(marketing)/page.tsx` erstellen
2. Hero-Section mit Value Proposition
3. Features erklären (Einfaches Formular → Einkaufsliste → Schaltplan)
4. CTA zum Wizard
5. Zielgruppe ansprechen (Anfänger)
6. SEO: Meta-Tags, Open Graph

**Erfolgskriterium:** Landing Page konvertiert zu Wizard-Start

---

## ☐ Punkt 19: i18n (DE/EN)

**Lies zuerst:**
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – Internationalisierung
- [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) – i18n Libraries

**Was zu tun ist:**
1. next-intl oder next-i18next einrichten
2. Deutsche Übersetzungen (Basis)
3. Englische Übersetzungen
4. Sprachauswahl im Header
5. KI-Prompts sprachabhängig

**Erfolgskriterium:** App in DE und EN nutzbar

---

## ☐ Punkt 20: Rechtliches & DSGVO

**Lies zuerst:**
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – Recht & Sicherheit
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – DSGVO

**Was zu tun ist:**
1. Impressum Seite
2. Datenschutzerklärung
3. Haftungsausschluss (im PDF und auf der Seite)
4. Cookie-Consent (falls Tracking)
5. 230V-Warnhinweise prominent

**Erfolgskriterium:** Alle rechtlichen Seiten vorhanden

---

## ☐ Punkt 21: Cron-Jobs (Cleanup)

**Lies zuerst:**
- [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) – Daten-Lifecycle, 90 Tage Löschung

**Was zu tun ist:**
1. Vercel Cron einrichten (`vercel.json`)
2. Täglicher Job: Abgelaufene Results löschen
3. Zugehörige PDFs aus Blob Storage entfernen
4. Hard Delete (DSGVO-konform)

**Erfolgskriterium:** Abgelaufene Daten werden automatisch gelöscht

---

## ☐ Punkt 22: Testing & Launch

**Lies zuerst:**
- [PRD_00_Overview.md](./docs/PRD_00_Overview.md) – Erfolgskriterien

**Was zu tun ist:**
1. End-to-End Test: Formular → Ergebnis → Kauf → PDF
2. Mobile-Test auf echten Geräten
3. PayPal Sandbox → Production wechseln
4. Domain konfigurieren (powersetup.de)
5. Monitoring aktivieren (Vercel Analytics)

**Erfolgskriterien:**
- Formular Completion Rate > 70 %
- Conversion zu Schaltplan > 10 %
- Affiliate CTR > 15 %

---

## PRD-Dateien Übersicht

| Datei | Inhalt | Link |
|-------|--------|------|
| Overview | Vision, Zielgruppe, User Flow, MVP Scope | [PRD_00_Overview.md](./docs/PRD_00_Overview.md) |
| UX & Formular | Multi-Step Formular, alle 8 Schritte, UI-Komponenten | [PRD_01_UX_Formular.md](./docs/PRD_01_UX_Formular.md) |
| Datenbank | Prisma Schema, Zod-Validierung, DSGVO | [PRD_02_Datenbank.md](./docs/PRD_02_Datenbank.md) |
| KI & Schaltplan | Gemini/OpenAI, Prompts, PDF-Generierung | [PRD_03_KI_Schaltplan.md](./docs/PRD_03_KI_Schaltplan.md) |
| Credit-System | PayPal, Pakete, Credit-Flow | [PRD_04_Credit_System.md](./docs/PRD_04_Credit_System.md) |
| Tech Stack | Next.js, Vercel, Ordnerstruktur | [PRD_05_Tech_Stack.md](./docs/PRD_05_Tech_Stack.md) |
