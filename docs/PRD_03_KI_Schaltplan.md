# PowerSetup – KI & Schaltplan-Generierung

## Übersicht

- **Primär**: Google Gemini
- **Fallback**: OpenAI API
- **Ausgabe**: PDF via Puppeteer (Server-Side)

---

## Aufgaben der KI

1. **Dimensionierung**
   - Batteriekapazität (Ah)
   - Solarleistung (Wp)
   - Kabelquerschnitte (mm²)
   - Sicherungswerte (A)

2. **Produktauswahl**
   - Aus vorgefiltertem Pool
   - Basierend auf Kompatibilität & Budget

3. **Schaltplan-Daten**
   - Strukturierte Daten für PDF-Rendering
   - Komponenten, Verbindungen, Werte

4. **Erklärungen**
   - Laienverständliche Begründungen
   - Warnhinweise

---

## Architektur (Token-optimiert)

```
┌─────────────────────────────────────────────────────────┐
│  1. REGELBASIERTE VORFILTERUNG (kein KI-Aufruf)         │
│     - Spannung passt? (12V/24V)                         │
│     - Kategorie relevant für gewählte Energiequellen?   │
│     - Batterietyp kompatibel?                           │
│     → Reduziert auf ~20-50 Produkte                     │
│                                                         │
│  2. SCORING/RANKING (kein KI)                           │
│     - Preis-Leistung                                    │
│     - Verfügbarkeit                                     │
│     - Bewertungen                                       │
│     → Top 3-5 pro Kategorie                             │
│                                                         │
│  3. KI-AUFRUF                                           │
│     - Input: ~15-30 Produkte + Formular-Daten           │
│     - Output: Finale Auswahl + Schaltplan-Daten         │
│                                                         │
│  4. PDF-GENERIERUNG (bei Kauf)                          │
│     - Puppeteer rendert HTML → PDF                      │
└─────────────────────────────────────────────────────────┘
```

---

## Vorfilterung (Regelbasiert)

### Spannungsfilter
```typescript
// Nur Produkte mit passender Spannung
products.filter(p => 
  p.specs.voltage === formData.voltage ||
  p.specs.inputVoltage?.includes(formData.voltage)
);
```

### Kategoriefilter
```typescript
// Nur relevante Kategorien basierend auf Energiequellen
const requiredCategories = [];
if (formData.energySources.includes('solar')) {
  requiredCategories.push('solar_panel', 'charge_controller');
}
if (formData.energySources.includes('alternator')) {
  requiredCategories.push('booster');
}
// ...
```

### Kompatibilitätsfilter
```typescript
// Batterietyp-Kompatibilität
if (formData.batteryType !== 'any') {
  products.filter(p => 
    p.specs.batteryTypes?.includes(formData.batteryType)
  );
}
```

---

## KI-Prompt-Struktur

### System-Prompt
```
Du bist ein Experte für mobile Stromversorgung in Campern und Booten.
Deine Aufgabe: Erstelle ein sicheres, normnahes Elektrik-Setup.

Regeln:
- Alle Komponenten müssen zueinander passen
- Sicherungen nach Kabelquerschnitt dimensionieren
- Warnhinweise bei 230V-Komponenten
- Erkläre Auswahl für Laien verständlich
```

### User-Prompt
```
Fahrzeug: {vehicleType}
Spannung: {voltage}V
Energiequellen: {energySources}
Verbraucher: {consumers mit Nutzungsdauer}
Autarkie-Ziel: {days} Tage
Budget: {comfortLevel}

Verfügbare Produkte:
{JSON der vorgefilterten Produkte}

Erstelle:
1. Finale Produktauswahl mit Begründung
2. Dimensionierungsberechnung
3. Schaltplan-Struktur (JSON)
4. Warnhinweise
```

### Erwartete Antwort (JSON)
```json
{
  "selectedProducts": [
    {
      "productId": "uuid",
      "reason": "Begründung für Laien"
    }
  ],
  "calculations": {
    "dailyConsumption": 120,
    "requiredCapacity": 240,
    "solarPower": 200,
    "cableSize": 6
  },
  "schematic": {
    "components": [...],
    "connections": [...],
    "labels": [...]
  },
  "warnings": [
    "230V-Arbeiten nur vom Fachbetrieb!"
  ]
}
```

---

## Schaltplan-Varianten

### Vereinfacht (Laien)
- Bunte Icons statt Normsymbole
- Große, lesbare Beschriftungen
- Pfeile für Energiefluss
- Einfache Farben (Rot = Plus, Blau = Minus)

### Technisch (Normnah)
- DIN/ISO-Symbole
- Normgerechte Farbcodes
- Kabelquerschnitte eingezeichnet
- Sicherungswerte

---

## PDF-Generierung

### Technologie
- **Puppeteer** (headless Chrome)
- Server-Side Rendering
- Template: React/HTML → PDF

### Inhalt
1. **Deckblatt**
   - PowerSetup Logo
   - Fahrzeugtyp + Datum
   - Disclaimer

2. **Übersicht**
   - Verbrauchszusammenfassung
   - Key Facts (Kapazität, Solar, etc.)

3. **Schaltplan**
   - Gewählte Variante (vereinfacht/technisch)
   - Legende

4. **Produktliste**
   - Alle Komponenten mit Affiliate-Links
   - QR-Codes für Mobile

5. **Warnhinweise**
   - 230V-Warnung
   - Haftungsausschluss
   - Fachbetrieb-Empfehlung

---

## Prompt-Versionierung

```prisma
model PromptVersion {
  id          String   @id @default(uuid())
  name        String   // "main_planning_v1"
  content     String   @db.Text
  isActive    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
}
```

- Neue Prompts testbar ohne Produktiv-Einfluss
- A/B-Testing möglich
- Rollback bei Problemen
