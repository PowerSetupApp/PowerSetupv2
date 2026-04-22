export type AlgorithmFieldType = "float" | "int" | "string" | "matrix";

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

/** Gruppierte Felder für `AlgorithmSettings` (id = default), v2-Algorithmus. */
export const ALGORITHM_SETTINGS_GROUPS: AlgorithmSettingsGroup[] = [
  {
    title: "Batterie (Chemie & Reserve)",
    description: "DoD, Roundtrip, Lade-/Absorptionsgrenzen und Kapazitätspuffer.",
    fields: [
      { key: "dodDefaults", label: "DoD je Chemie", type: "matrix" },
      { key: "roundtripDefaults", label: "Roundtrip-Wirkungsgrad", type: "matrix" },
      { key: "cRateChargeMax", label: "Max. Lade-C-Rate", type: "matrix" },
      { key: "absorptionTailH", label: "Absorption / Float (h)", type: "matrix" },
      { key: "batterySafetyFactor", label: "Reserve-Faktor (×)", type: "float", suffix: "×" },
      { key: "hardBridgeDays", label: "Hard-Bridge Tage", type: "float", suffix: "Tage" },
    ],
  },
  {
    title: "Autarky & Top-Up-Deckel",
    description: "Weiche Brücke: PSH-Derate, Brückentage, Coverage-Caps und Portable-Bump.",
    fields: [
      { key: "autarchyPshDerate", label: "Autarky PSH-Derate", type: "float", suffix: "×" },
      { key: "autarchyMaxBridgeDays", label: "Max. Brückentage", type: "float", suffix: "Tage" },
      { key: "topUpCoverageCap", label: "Top-Up Coverage Cap", type: "float", suffix: "×" },
      { key: "topUpCoverageCapAtLowPsh", label: "Cap bei niedriger PSH", type: "float", suffix: "×" },
      { key: "topUpCoveragePshBandHigh", label: "PSH Band oben (h)", type: "float", suffix: "h" },
      { key: "topUpCoveragePshBandLow", label: "PSH Band unten (h)", type: "float", suffix: "h" },
      { key: "topUpCoveragePortableWeight", label: "Portable-Gewichtung", type: "float", suffix: "×" },
      { key: "topUpCoveragePortableCapBump", label: "Portable Cap-Bump", type: "float", suffix: "×" },
      { key: "topUpCoverageAbsMax", label: "Coverage absolut max", type: "float", suffix: "×" },
      {
        key: "shoreBatteryReliefAutarchyThresholdDays",
        label: "Shore-Relief ab Autarkie (Tage)",
        type: "float",
        suffix: "Tage",
      },
    ],
  },
  {
    title: "Shore & Charger",
    description: "Landstrom-Lader: Wirkungsgrad und Ziel-C-Raten.",
    fields: [
      { key: "chargerEfficiency", label: "Lader-Wirkungsgrad", type: "float", suffix: "×" },
      { key: "chargerTargetCRate", label: "Ziel-C-Rate je Shore-Profil", type: "matrix" },
      { key: "shoreBridgeReliefDays", label: "Shore-Bridge-Relief (Tage)", type: "matrix" },
    ],
  },
  {
    title: "Alternator & Booster",
    description: "Lichtmaschinen-Limit, Booster-Wirkungsgrad, LM-Brücken-Credit.",
    fields: [
      { key: "alternatorContinuousLimitA", label: "LiMa Dauerstrom", type: "float", suffix: "A" },
      { key: "boosterEfficiency", label: "Booster-Wirkungsgrad", type: "float", suffix: "×" },
      { key: "alternatorBridgeStandingCredit", label: "LM-Brücken-Credit (Standzeit)", type: "matrix" },
      { key: "topUpCoverageStandingCapMult", label: "Top-Up-Cap-Mult (Standzeit)", type: "matrix" },
    ],
  },
  {
    title: "Wechselrichter",
    description: "Gleichrichter-Wirkungsgrad und Standby.",
    fields: [
      { key: "inverterEfficiency", label: "WR-Wirkungsgrad", type: "float", suffix: "×" },
      { key: "inverterStandbyW", label: "Standby-Leistung", type: "float", suffix: "W" },
      { key: "inverterStandbyHours", label: "Standby-Stunden / Tag", type: "float", suffix: "h" },
    ],
  },
  {
    title: "Solar",
    description: "Ertrag, Modul-Wp/m², Dach-Packing, Solartaschen.",
    fields: [
      { key: "solarSystemEfficiency", label: "System-Wirkungsgrad", type: "float", suffix: "×" },
      { key: "wpPerM2Rigid", label: "Wp/m² starr", type: "float", suffix: "Wp" },
      { key: "wpPerM2Flexible", label: "Wp/m² flexibel", type: "float", suffix: "Wp" },
      { key: "roofUtilizationFactor", label: "Dach-Packing", type: "float", suffix: "×" },
      { key: "solarBagUtilization", label: "Solartaschen-Nutzung", type: "float", suffix: "×" },
    ],
  },
  {
    title: "Kabel & Spannungsabfall",
    description: "Grenzwerte für die Querschnittsberechnung.",
    fields: [
      { key: "voltageDropCritical", label: "Kritisch", type: "float", suffix: "%" },
      { key: "voltageDropNormal", label: "Normal", type: "float", suffix: "%" },
      { key: "copperResistivity", label: "Kupfer ρ", type: "float", suffix: "Ω·mm²/m" },
      { key: "cableCurrentSafetyFactor", label: "Kabel-Sicherheitsfaktor", type: "float", suffix: "×" },
      { key: "ambientTempC", label: "Umgebungstemperatur (Fahrzeug)", type: "float", suffix: "°C" },
    ],
  },
  {
    title: "Gleichzeitigkeit (Peak-Faktor)",
    description: "Faktor auf AC-Spitzenlast je Lastprofil.",
    fields: [{ key: "peakFactor", label: "Peak-Faktor (low / moderate / high)", type: "matrix" }],
  },
  {
    title: "Haupt-Tabellen (Matrix)",
    description: "PSH, Autarkie-Obergrenzen, Solartaschen-Uplift, Fahrstunden.",
    fields: [
      { key: "pshTable", label: "PSH-Tabelle", type: "matrix" },
      { key: "maxAutarchyDays", label: "Max. Autarkie-Tage", type: "matrix" },
      { key: "solarBagAlignmentUplift", label: "Solartaschen-Uplift", type: "matrix" },
      { key: "driveHoursPerDay", label: "Fahrstunden / Tag", type: "matrix" },
    ],
  },
  {
    title: "Produkt-Vorauswahl (KI)",
    description: "Match-Score-Schwelle für die KI-Produktauswahl",
    tooltip: "Nur Produkte über dieser Schwelle werden der KI angeboten.",
    fields: [{ key: "minPreselectionScore", label: "Min. Match-Score", type: "int", suffix: "/ 100" }],
  },
];
