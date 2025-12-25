# PowerSetup – UX & Formular

## Design-Prinzipien

- **Mobile-first** (80-90% der Nutzer)
- **Zero-Keyboard**: So wenig Tastatureingaben wie möglich
- **Touch-optimiert**: Min. 48x48px Tap-Targets
- **Selbsterklärend**: Icons + kurze Labels
- **Single-Column Layout**: Keine horizontale Navigation
- **Fortschrittsanzeige**: Visueller Step-Indicator

---

## Unterstützte HTML5 Input-Typen

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

## Formular-Schritte

### Schritt 1: Fahrzeugtyp
**Input**: Icon-Buttons (Radio-Verhalten)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Campervan | 🚐 | Kastenwagen, VW Bus |
| Wohnmobil | 🚙 | Integriert, Teilintegriert |
| Wohnwagen | 🏕️ | Caravan, Anhänger |
| Boot | ⛵ | Segelboot, Motorboot |
| Offroad | 🚗 | Geländewagen, Expedition |

---

### Schritt 2: Systemspannung
**Input**: Segmented Control (Radio-Buttons als Pills)

| Option | Beschreibung |
|--------|--------------|
| 12V | Standard PKW/Camper |
| 24V | LKW, große Boote |

**Default**: 12V

---

### Schritt 3: Energiequellen
**Input**: Icon-Checkboxen (Mehrfachauswahl)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Bordbatterie | 🔋 | Zusätzliche Batterie |
| Solar | ☀️ | Solarmodule |
| Lichtmaschine | ⚡ | Ladebooster während Fahrt |
| Landstrom | 🔌 | 230V Campingplatz |
| Generator | ⛽ | Mobiler Generator |

**Validierung**: Mindestens 1 Pflicht

---

### Schritt 4: Verbraucher auswählen
**Input**: Icon-Checkboxen mit Kategorien (Akkordeon/Tabs)

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

---

### Schritt 5: Nutzungsintensität
**Input**: Preset-Buttons + optionaler Range-Slider

| Preset | Icon | Bedeutung |
|--------|------|-----------|
| Wenig | 🌙 | 1-2h/Tag |
| Normal | ☀️ | 3-5h/Tag |
| Viel | 🔆 | 6-12h/Tag |
| Dauerbetrieb | ♾️ | 24/7 |

**Alternative**: Range-Slider (0-24h) bei "Erweitert"

---

### Schritt 6: Autarkie-Ziel
**Input**: Segmented Control + Range-Slider

| Option | Beschreibung |
|--------|--------------|
| Wochenende | 2-3 Tage |
| Urlaubsreise | 5-7 Tage |
| Vollautark | 14+ Tage |

**Zusatz**: Range-Slider für exakte Tagesanzahl (1-30)

---

### Schritt 7: Komfort-Level (Produktqualität)
**Input**: Card-Selection (Radio)

| Level | Icon | Beschreibung | Preisklasse |
|-------|------|--------------|-------------|
| Budget | 💰 | Funktional, günstig | € |
| Standard | ⭐ | Gutes Preis-Leistung | €€ |
| Premium | 👑 | Hochwertig, langlebig | €€€ |

---

### Schritt 8: Schaltplan-Präferenz
**Input**: Card-Selection (Radio)

| Option | Icon | Beschreibung |
|--------|------|--------------|
| Vereinfacht | 🎨 | Bunte Icons, leicht verständlich |
| Technisch | 📐 | Normgerecht, DIN-Symbole |

---

## Optionale Zusatzfragen

### Batterietyp-Präferenz (wenn Bordbatterie gewählt)

| Option | Icon | Pro | Contra |
|--------|------|-----|--------|
| AGM | 🔋 | Günstig, robust | Schwer, weniger Zyklen |
| LiFePO4 | ⚡ | Leicht, langlebig | Teuer |
| Egal | 🤷 | KI entscheidet | - |

---

## UI-Komponenten

### Icon-Button (Radio/Checkbox)
```
┌─────────────────────┐
│        🚐          │  ← Icon (32-48px)
│     Campervan       │  ← Label
│  Kastenwagen, VW    │  ← Sublabel (optional)
└─────────────────────┘
Min. 80x80px Touch-Target
```

### Preset-Slider Hybrid
```
┌───────┬───────┬───────┬───────┐
│ Wenig │Normal │ Viel  │Dauer  │
└───────┴───────┴───────┴───────┘
     ●━━━━━━━━━━━━━━━━━━●
     0h                24h
```

### Segmented Control
```
┌─────────────┬─────────────┐
│     12V     │     24V     │
│   (aktiv)   │             │
└─────────────┴─────────────┘
```

### Fortschrittsanzeige
```
  ●─────────●─────────●─────────○─────────○─────────○─────────○─────────○
Fahrzeug  Spannung  Energie  Verbraucher  ...
```

**Klickbar** für Navigation, abgeschlossene Schritte editierbar.

---

## Ergebnis-Seite (kostenlos)

### Produktempfehlung
- Kategorisiert (Batterie, Solar, Sicherungen, Kabel)
- Max. 2–3 Alternativen pro Kategorie
- Affiliate-Link (Amazon)

### Verbrauchszusammenfassung
- Täglicher Verbrauch (vereinfacht)
- Empfohlene Kapazitäten (ohne technische Tiefe)

### CTA
- "Schaltplan als PDF generieren" (kostenpflichtig)
