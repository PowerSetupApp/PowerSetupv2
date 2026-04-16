# PowerSetup — Fachbegriffe & Domain-Wissen

## Elektrik-Fachbegriffe

| Begriff | Bedeutung |
|---------|-----------|
| **Ah** | Amperestunden — Maß für Batteriekapazität (z.B. 100Ah) |
| **Wp** | Watt-Peak — Nennleistung eines Solarmoduls unter Testbedingungen |
| **DoD** | Depth of Discharge — Entladetiefe: LiFePO4 95%, AGM/Gel 50% |
| **PSH** | Peak Sun Hours — effektive Sonnenstunden je Region und Saison |
| **MPPT** | Maximum Power Point Tracker — effizienter Laderegler (besser als PWM) |
| **PWM** | Pulse Width Modulation — einfacherer, günstigerer Laderegler |
| **Ladebooster (B2B)** | Battery-to-Battery Charger — lädt Servicebatterie von Lichtmaschine während Fahrt |
| **Wechselrichter** | Wandelt 12V DC → 230V AC für Haushaltsgeräte |
| **Sinus** | Wechselrichter-Wellenform: Pure Sine (rein sinusförmig) = besser, Modified Sine = günstiger |

## Batterietypen

| Typ | DoD | Zyklen | Vorteil | Nachteil |
|-----|-----|--------|---------|----------|
| **LiFePO4** | 95% | 3000+ | Leicht, langlebig | Teuer |
| **AGM** | 50% | 300-500 | Günstig, robust | Schwer, weniger Kapazität nutzbar |
| **Gel** | 50% | 300-500 | Wartungsfrei | Teurer als AGM |

## Fahrzeug-Systemspannungen

- **12V** — Standard PKW, Camper, kleine Boote
- **24V** — LKW, große Boote, Wohnmobile
- **48V** — Selten, große Systeme

## Berechnungs-Logik (vereinfacht)

```
Tagesverbrauch (Wh) = Σ (Verbraucher-Watt × Nutzungsstunden × Gleichzeitigkeitsfaktor)

Batteriekapazität (Ah) = Tagesverbrauch × Autarkie-Tage / DoD / Systemspannung

Solarleistung (Wp) = Tagesverbrauch / PSH × Sicherheitsfaktor

Kabeldurchmesser (mm²) = (Strom × 2 × Länge × Kupferwiderstand) / zulässiger Spannungsabfall
```

## Business-Regeln

| Regel | Detail |
|-------|--------|
| **Result-UUID** | 90 Tage gültig, dann Hard Delete |
| **Kein User-Account** | Zugang nur über Result-UUID |
| **Credit-System** | 1 Schaltplan = 1 Credit. Inputs ändern = kostenlos. Neue PDF = kostet erneut. |
| **Credit-Pakete** | Einzel 4,99€ / Starter 3×9,99€ / Pro 10×24,99€ |
| **Schaltplan-Varianten** | Vereinfacht (Laien-Icons) oder Technisch (DIN-Symbole) |
| **Affiliate** | Amazon Affiliate-Tag: `rasenrobote07-21` — nur server-seitig |

## Produkt-Kategorien (in DB)

- Batterien (AGM, Gel, LiFePO4)
- Solarmodule
- Laderegler (MPPT, PWM)
- Ladebooster (B2B)
- Wechselrichter
- Sicherungen
- Kabel
- Landstrom-Adapter

## Algorithmus-Phasen (Kurzübersicht)

1. Energiebedarf berechnen (Wh/Tag)
2. Batteriekapazität dimensionieren
3. Solarertrag berechnen (PSH-Matrix nach Region/Saison)
4. Ladebooster dimensionieren
5. Ladegerät dimensionieren
6. Wechselrichter dimensionieren
7. Kabelquerschnitte berechnen
8. Laderegler dimensionieren
9. Produkt-Vorfilterung (DB → Top N für KI)
