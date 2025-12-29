# KI & Schaltplan Regeln

## Stack
- **Primär**: Google Gemini
- **Fallback**: OpenAI API
- **PDF**: Puppeteer (Server-Side)

## KI-Aufgaben
1. **Dimensionierung**: Batteriekapazität, Solarleistung, Kabelquerschnitte, Sicherungswerte
2. **Produktauswahl**: Aus vorgefiltertem Pool, basierend auf Kompatibilität & Budget
3. **Schaltplan-Daten**: Strukturierte JSON für PDF-Rendering
4. **Erklärungen**: Laienverständlich, mit Warnhinweisen

## Architektur (Token-optimiert)

```
1. REGELBASIERTE VORFILTERUNG (kein KI)
   - Spannung passt? (12V/24V)
   - Kategorie relevant?
   - Batterietyp kompatibel?
   → Reduziert auf ~20-50 Produkte

2. SCORING/RANKING (kein KI)
   - Preis-Leistung, Verfügbarkeit, Bewertungen
   → Top 3-5 pro Kategorie

3. KI-AUFRUF
   - Input: ~15-30 Produkte + Formular-Daten
   - Output: Finale Auswahl + Schaltplan-Daten

4. PDF-GENERIERUNG (bei Kauf)
   - Puppeteer rendert HTML → PDF
```

## KI-Prompt Regeln
- **System-Prompt**: Experte für mobile Stromversorgung
- Alle Komponenten müssen zueinander passen
- Sicherungen nach Kabelquerschnitt dimensionieren
- Warnhinweise bei 230V-Komponenten
- Erklärungen laienverständlich

## Erwartete KI-Antwort (JSON)
```json
{
  "selectedProducts": [{ "productId": "uuid", "reason": "Begründung" }],
  "calculations": { "dailyConsumption": 120, "requiredCapacity": 240 },
  "schematic": { "components": [], "connections": [], "labels": [] },
  "warnings": ["230V-Arbeiten nur vom Fachbetrieb!"]
}
```

## Schaltplan-Varianten
| Typ | Beschreibung |
|-----|--------------|
| **Vereinfacht** | Bunte Icons, große Beschriftungen, Pfeile für Energiefluss |
| **Technisch** | DIN/ISO-Symbole, normgerechte Farbcodes, Kabelquerschnitte |

## PDF-Inhalt
1. Deckblatt (Logo, Fahrzeugtyp, Disclaimer)
2. Übersicht (Verbrauch, Key Facts)
3. Schaltplan (gewählte Variante + Legende)
4. Produktliste (Affiliate-Links, QR-Codes)
5. Warnhinweise (230V, Haftung, Fachbetrieb)
