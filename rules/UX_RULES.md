# UX & Formular Regeln

## Design-Prinzipien
- **Mobile-first**: 80-90% der Nutzer auf Mobile
- **Zero-Keyboard**: Wenn möglich Keine Texteingaben, nur Auswahl
- **Touch-optimiert**: Min. 48x48px Tap-Targets
- **Single-Column Layout**: Keine horizontale Navigation
- **Fortschrittsanzeige**: Klickbarer Step-Indicator

## Erlaubte Input-Typen
| Typ | Verwendung |
|-----|------------|
| `radio` | Icon-Buttons für Einzelauswahl |
| `checkbox` | Icon-Buttons für Mehrfachauswahl |
| `range` | Slider (keine Tastatur) |
| `select` | Dropdown (Native Picker) |
| `button` | Toggle-Buttons |

> ⚠️ **VERBOTEN**: `text`, `textarea` – erfordern Tastatureingabe

## UI-Komponenten

### Icon-Button
- Min. 80x80px Touch-Target
- Icon (32-48px) + Label + optionaler Sublabel

### Segmented Control
- Für 2-3 Optionen (z.B. 12V/24V)
- Pills-Style mit aktivem Zustand

### Preset-Slider Hybrid
- Vordefinierte Presets als Buttons
- Optionaler feiner Slider bei "Erweitert"

## Wizard-Schritte
1. **Fahrzeugtyp**: Icon-Buttons (Radio)
2. **Systemspannung**: Segmented Control (12V/24V)
3. **Energiequellen**: Icon-Checkboxen (Mehrfach, min. 1)
4. **Verbraucher**: Kategorisierte Icon-Checkboxen
5. **Nutzungsintensität**: Preset-Buttons (Wenig/Normal/Viel/Dauer)
6. **Autarkie-Ziel**: Segmented + Range-Slider
7. **Komfort-Level**: Card-Selection (Budget/Standard/Premium)
8. **Schaltplan-Präferenz**: Card-Selection (Vereinfacht/Technisch)

## Ergebnis-Seite
- **Kostenlos**: Produktempfehlungen, Verbrauchsübersicht
- **CTA**: "Schaltplan als PDF generieren" (kostenpflichtig)
- Max. 2-3 Alternativen pro Produktkategorie
