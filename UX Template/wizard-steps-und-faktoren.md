# Spezifikation: Neuentwicklung requirements-engine.ts

Dies ist die Basis für den Rewrite des Algorithmus. Sie enthält alle User-Inputs, die vorhandenen Konfigurations-Faktoren und die Logik-Beziehungen.

## 1. Verfügbare User-Eingaben (Wizard Steps)

### Step 1: System-Grundlagen
*   **Systemspannung:** `12V`, `24V`, `48V`
*   **Fahrzeugspannung (Starter):** `12V`, `24V` (beeinflusst Ladebooster-Auswahl)
*   **Batterie-Präferenz:** `LiFePO4`, `AGM`, `GEL` (bestimmt Entladetiefe DoD)

### Step 2: Energiequellen
*   **Quellen (Mehrfachwahl):** [Solar](cci:2://file:///c:/Users/renem/Desktop/PowerSetup/src/lib/requirements-engine.ts:33:0-36:1), `Lichtmaschine` (Ladebooster), `Landstrom`
*   **Solar-Konfiguration (wenn gewählt):**
    *   **Modul-Typ:** `Starr (Rahmen)` oder `Flexibel`
    *   **Dachflächen:** Liste von Rechtecken (Länge x Breite in cm)
*   **Lichtmaschine (wenn gewählt):**
    *   **Typ:** `Standard` (~90-120A), `Verstärkt` (~150A+), `Euro 6d (Smart Generatoren)`
*   **Landstrom (wenn gewählt):**
    *   **Ladegeschwindigkeit:** `Langsam/Schonend`, `Normal`, `Schnell`

### Step 3: Verbraucher (Detaillierte Lastberechnung)
*   **Liste von Geräten** (z.B. Licht, Laptop, Kaffeemaschine)
*   **Pro Gerät:**
    *   Leistung (Watt)
    *   Spannung (`12V`, `24V` oder `230V`)
    *   Laufzeit pro Tag (Stunden)
*   **Spezialfall Kühlgeräte:**
    *   Technologie: `Kompressor` oder `Absorber`
    *   Für Absorber: Gasbetrieb möglich? (Ja/Nein), Wenn Ja: Strom-Anteil (%)
*   **Spezialfall Installation:** "Fest verbaut?" (Ja/Nein) -> relevant für Kabelplanung

### Step 4: Reiseverhalten & Solar-Ertrag
*   **Saison:** `Nur Sommer`, `Ganzjahr`, `Winter-Fokus` -> bestimmt Sonnenstunden
*   **Reisedauer:** `Wochenende`, `Woche`, `Langzeit`, `Dauercamper`
*   **Winter-Region:** `D/Alpen`, `Südeuropa`, `Skandinavien` -> bestimmt Standort-Faktor
*   **Standzeit (ohne Fahren):** `Kurz` (alle 2 Tage fahren), `Mittel` (~5 Tage), `Lang` (bis 14 Tage) -> bestimmt Lichtmaschinen-Beitrag

### Step 5: Autarkie-Ziel (Batterie-Dimensionierung)
*   **Ziel:** `Wochenende` (2 Tage), `Urlaub` (1 Woche), `Vollautark` (Max)
*   **Gewünschte Autarkie:** Slider 1 - 90 Tage
*   **Verfügbarer Platz:** `Kompakt`, `Mittel`, `Viel Platz` -> setzt Obergrenze für Batteriekapazität

### Step 6: Verkabelung
*   **Kabellängen (in Metern) für alle Teilstrecken:**
    *   Starterbatterie ↔ Ladebooster
    *   Ladebooster ↔ Aufbaubatterie
    *   Solar ↔ Regler
    *   Regler ↔ Aufbaubatterie
    *   Ladegerät ↔ Aufbaubatterie
    *   Aufbaubatterie ↔ Verteiler/Inverter

### Step 7: Präferenzen
*   **Budget:** `Budget`, `Standard`, `Premium` (beeinflusst ggf. Produktvorschläge, nicht primär die Physik)

### Step 8: Ergebnis-Anpassung (Neu / Dynamisch)
*   **Add-on Solartaschen:** Wenn Dachfläche < Bedarf, kann der User mobile Module hinzufügen.
    *   Stufen: `+100W`, `+200W`, `+300W`, `+400W`
    *   Ändert Systemtyp auf `mixed`

---

## 2. Faktoren & Berechnungslogik (Algorithm Settings)

### A. Batterie-Berechnung
*   **Entladetiefe (DoD):**
    *   `LiFePO4`: 90% (0.9)
    *   `AGM` / `GEL`: 50% (0.5)
*   **Sicherheitsfaktor:** Errechnete Kapazität x `1.3` (+30% Puffer).
*   **Nacht-Reserve:** Muss mind. 14h Dunkelheit abdecken können (Basis-Verbrauch).
*   **Schlechtwetter-Reserve:** Mind. 1-4 Tage Puffer je nach Autarkie-Level, wenn Solarertrag = 20% (Cloudy).

### B. Solar-Ertragsprognose (Wh/Tag)
*   **Sonnenstunden (Peak Sun Hours):**
    *   `Sommer`: 5.0h
    *   `Ganzjahr/Mix`: 3.5h
    *   [Winter](cci:2://file:///c:/Users/renem/Desktop/PowerSetup/src/lib/store/wizard-store.ts:22:0-22:91): 2.0h
*   **Standort-Faktor (Winter):**
    *   `Skandinavien`: 0.6x
    *   `Deutschland`: 0.8x
    *   `Südeuropa`: 1.2x
*   **Technischer Wirkungsgrad:**
    *   **MPPT & System:** Pauschal `0.85` (15% Verlust)
    *   **Dach-Nutzungsgrad:** `0.75` (Fläche ist nie 100% mit Zellen belegbar)
*   **Ausrichtungs-Faktor (Orientation):**
    *   `Starr/Flexibel auf Dach`: **0.85** (da flach liegend)
    *   `Mobile Solartasche`: **1.00** (da zur Sonne ausrichtbar)
*   **Cloudy Factor:** Bei Schlechtwetter nur 20% (`0.2`) Ertrag.

### C. Lichtmaschine / Ladebooster
*   **Leistungsklassen:**
    *   Standard: 30A Empfehlung
    *   Verstärkt: 50A+ Empfehlung
    *   Euro 6d: Limitiert auf 30A (zum Schutz)
*   **Beitrag zur Bilanz:**
    *   Abhängig von "Standzeit".
    *   *Kurze Standzeit* = Häufiges Fahren = Hoher täglicher Ertrag.
    *   *Lange Standzeit* = Kaum Fahren = Ertrag vernachlässigbar (System muss via Solar/Batterie stehen).

### D. Wechselrichter (Inverter)
*   **Dimensionierung:** Summe aller 230V-Geräte-Leistungen.
*   **Gleichzeitigkeitsfaktor:** 0.3 bis 0.7 (nicht alle Geräte laufen gleichzeitig).
*   **Puffer:** Aufrundung zur nächsten Standardgröße (500W, 1000W, 1500W, 2000W, 3000W).

### E. Kabelquerschnitte
*   **Basis:** Stromstärke (A) und Kabellänge (m).
*   **Maximaler Spannungsabfall:**
    *   Kritisch (Inverter/Lader): **2%**
    *   Normal / Solar: **3%**
*   **Material:** Reines Kupfer (Rho = 0.0178).

---

## 3. Ziel des neuen Algorithmus
Der neue [requirements-engine.ts](cci:7://file:///c:/Users/renem/Desktop/PowerSetup/src/lib/requirements-engine.ts:0:0-0:0) soll:
1.  Diese Logiken sauberer und modularer abbilden.
2.  Den Unterschied zwischen "Dach-Solar" (Faktor 0.85) und "Solartaschen" (Faktor 1.0) korrekt summieren.
3.  Die "Schlechtwetter-Autarkie" (Batterie muss halten) vs. "Durchschnitts-Autarkie" (Solar deckt Verbrauch) klarer trennen.
4.  Eine realistische "Empfehlung" ausgeben, die nicht stur das Worst-Case-Szenario annimmt (Kosten/Nutzen), aber transparent warnt.