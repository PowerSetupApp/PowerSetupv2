export type AlgorithmFieldType = "float" | "int" | "string";

export type AlgorithmField = {
  key: string;
  label: string;
  type: AlgorithmFieldType;
  suffix?: string;
};

export type AlgorithmSettingsGroup = {
  title: string;
  description: string;
  tooltip?: string;
  fields: AlgorithmField[];
};

/** Gruppierte Felder für `AlgorithmSettings` (id = default). */
export const ALGORITHM_SETTINGS_GROUPS: AlgorithmSettingsGroup[] = [
  {
    title: "Entladetiefe (DoD)",
    description: "Depth of Discharge pro Batterietyp",
    fields: [
      { key: "dodLifepo4", label: "LiFePO4", type: "float", suffix: "%" },
      { key: "dodAgm", label: "AGM", type: "float", suffix: "%" },
      { key: "dodGel", label: "Gel", type: "float", suffix: "%" },
    ],
  },
  {
    title: "Gleichzeitigkeitsfaktor",
    description: "Wie viele Geräte gleichzeitig laufen",
    tooltip:
      "Der Algorithmus wählt IMMER das Maximum aus: Entweder (Gesamtlast * Faktor) ODER (Stärkster Einzelverbraucher). Zusätzlich werden 10% Sicherheitspuffer addiert.",
    fields: [
      { key: "simultaneousLow", label: "Wenig", type: "float" },
      { key: "simultaneousModerate", label: "Moderat", type: "float" },
      { key: "simultaneousHigh", label: "Viele", type: "float" },
    ],
  },
  {
    title: "Ladebooster & Lichtmaschine",
    description: "Eingangsstrom der Lichtmaschine (Standard / Verstärkt), Wirkungsgrad und Fahrzeit.",
    tooltip:
      "Der Algorithmus entscheidet zwischen Standard und Verstärkt auf Basis der Nutzer-Auswahl im Wizard (alternatorTier).",
    fields: [
      { key: "alternatorStandard", label: "Standard-LiMa", type: "int", suffix: "A" },
      { key: "alternatorEnhanced", label: "Verstärkte LiMa", type: "int", suffix: "A" },
      { key: "boosterEfficiency", label: "Booster-Wirkungsgrad", type: "float", suffix: "x" },
      { key: "alternatorDriveHours", label: "Fahrzeit pro Tag", type: "float", suffix: "h" },
    ],
  },
  {
    title: "Batterie-Sicherheitspuffer",
    description: "Multiplikator auf die berechnete Kapazität",
    tooltip:
      "Erhöht die Batterieempfehlung um diesen Faktor. Beispiel: Bei 1.5 wird eine berechnete 100Ah Batterie auf 150Ah aufgerundet.",
    fields: [{ key: "batterySafetyFactor", label: "Sicherheitsfaktor", type: "float", suffix: "x" }],
  },
  {
    title: "Standzeit-Definitionen",
    description: "Definiert, wie viele Tage „Kurz“, „Mittel“ und „Lang“ bedeuten",
    fields: [
      { key: "standingDaysShort", label: "Kurz", type: "int", suffix: "Tage" },
      { key: "standingDaysMedium", label: "Mittel", type: "int", suffix: "Tage" },
      { key: "standingDaysLong", label: "Lang", type: "int", suffix: "Tage" },
    ],
  },
  {
    title: "Max. Backup-Puffer",
    description: "Maximale Autarkie-Dauer für die Mindestkapazität (ohne Solar).",
    fields: [{ key: "maxBackupDays", label: "Maximal-Limit", type: "int", suffix: "Tage" }],
  },
  {
    title: "Solar Wp & Wirkungsgrade",
    description: "Leistung pro m² sowie Puffer- und Wirkungsgrad-Faktoren",
    fields: [
      { key: "wpPerM2Rigid", label: "Starr (Glas)", type: "int", suffix: "Wp" },
      { key: "wpPerM2Flexible", label: "Flexibel", type: "int", suffix: "Wp" },
      { key: "cloudyYieldFactor", label: "Bewölkt-Faktor (Basis)", type: "float", suffix: "x" },
      { key: "cloudyYieldFactorSummer", label: "Bewölkt-Faktor Sommer", type: "float", suffix: "x" },
      { key: "cloudyYieldFactorWinter", label: "Bewölkt-Faktor Winter", type: "float", suffix: "x" },
      { key: "recommendedSolarYieldFactor", label: "Solar-Puffer (Empfehlung)", type: "float", suffix: "x" },
      { key: "solarSafetyFactor", label: "Regler-Sicherheitsfaktor", type: "float", suffix: "x" },
      { key: "solarSystemEfficiency", label: "System-Wirkungsgrad", type: "float", suffix: "x" },
      { key: "maxPortableWp", label: "Max. Solartasche", type: "int", suffix: "Wp" },
      { key: "roofUtilizationFactor", label: "Dach-Auslastung", type: "float", suffix: "x" },
      { key: "roofOrientationFactor", label: "Dach-Orientierung (Fest)", type: "float", suffix: "x" },
      { key: "portableOrientationFactor", label: "Taschen-Orientierung", type: "float", suffix: "x" },
    ],
  },
  {
    title: "Sonnenstunden",
    description: "Durchschnittliche Sonnenstunden pro Tag (D-A-CH)",
    tooltip: "Basis-Werte für die Berechnung, multipliziert mit Standort-Faktor je nach Saison.",
    fields: [
      { key: "sunHoursSummer", label: "Nur Sommer", type: "float", suffix: "h" },
      { key: "sunHoursAllYear", label: "Ganzjährig", type: "float", suffix: "h" },
      { key: "sunHoursWinter", label: "Winterfokus", type: "float", suffix: "h" },
    ],
  },
  {
    title: "Standort-Modifikatoren",
    description: "Sonnenstunden-Multiplikator nach Reise-/Winterstandort",
    tooltip: "Wird mit den Basis-Sonnenstunden multipliziert: PSH = sunHours × locationFactor.",
    fields: [
      { key: "locationGermanyAlps", label: "Deutschland/Alpen", type: "float", suffix: "x" },
      { key: "locationSouthernEurope", label: "Südeuropa", type: "float", suffix: "x" },
      { key: "locationScandinavia", label: "Skandinavien", type: "float", suffix: "x" },
      { key: "locationEastern", label: "Osteuropa", type: "float", suffix: "x" },
      { key: "locationVaries", label: "Variiert", type: "float", suffix: "x" },
    ],
  },
  {
    title: "Kühlgeräte Duty Cycle",
    description: "Anteil der Zeit, die Kühlgeräte aktiv kühlen",
    fields: [
      { key: "dutyCycleCompressor", label: "Kompressor", type: "float" },
      { key: "dutyCycleAbsorber", label: "Absorber", type: "float" },
    ],
  },
  {
    title: "Landstrom-Ladezeit",
    description: "Ziel-Ladezeit für 0–100 % je nach Nutzer-Präferenz",
    tooltip: "Dimensioniert das Ladegerät: Kapazität ÷ Zielzeit ≈ Ladestrom.",
    fields: [
      { key: "chargerTimeHoursSlow", label: "Langsam", type: "float", suffix: "h" },
      { key: "chargerTimeHoursNormal", label: "Normal", type: "float", suffix: "h" },
      { key: "chargerTimeHoursFast", label: "Schnell", type: "float", suffix: "h" },
      {
        key: "chargerAbsorptionOverhead",
        label: "Absorption-Overhead",
        type: "float",
        suffix: "×",
      },
    ],
  },
  {
    title: "Komponentenklassen",
    description: "Verfügbare Größen (kommasepariert)",
    fields: [
      { key: "inverterClasses", label: "Wechselrichter (W)", type: "string" },
      { key: "chargerClasses", label: "Batterieladegeräte (A)", type: "string" },
      { key: "solarControllerClasses", label: "Solar-Laderegler (A)", type: "string" },
      { key: "cableSizes", label: "Kabelquerschnitte (mm²)", type: "string" },
    ],
  },
  {
    title: "Spannungsabfall",
    description: "Maximaler zulässiger Spannungsabfall",
    fields: [
      { key: "voltageDropCritical", label: "Kritisch (Inverter)", type: "float", suffix: "%" },
      { key: "voltageDropNormal", label: "Normal", type: "float", suffix: "%" },
      { key: "voltageDropSolar", label: "Solar", type: "float", suffix: "%" },
    ],
  },
  {
    title: "Kupfer-Widerstand",
    description: "Spezifischer Widerstand für Kabelberechnung",
    fields: [{ key: "copperResistivity", label: "Ρ (Kupfer)", type: "float", suffix: "Ω·mm²/m" }],
  },
  {
    title: "Produkt-Vorauswahl (KI)",
    description: "Match-Score-Schwelle für die KI-Produktauswahl",
    tooltip: "Nur Produkte über dieser Schwelle werden der KI angeboten.",
    fields: [{ key: "minPreselectionScore", label: "Min. Match-Score", type: "int", suffix: "/ 100" }],
  },
];
