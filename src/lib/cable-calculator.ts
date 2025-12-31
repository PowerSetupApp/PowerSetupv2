/**
 * Kabelberechnung für Wohnmobil-Elektrik
 * Basiert auf elektrotechnischen Formeln (Spannungsabfall)
 */

export interface CableRequirement {
    route: string;
    displayName: string;
    maxPower: number;       // Watt
    voltage: number;        // Volt
    current: number;        // Ampere
    length: number;         // Meter
    minCrossSection: number;// mm² (berechnet)
    recommendedCrossSection: number; // mm² (auf Standard gerundet)
}

export interface CableSizingSettings {
    maxVoltageDrop: number;      // Prozent (z.B. 3%)
    copperResistivity: number;   // Ω·mm²/m (Kupfer: 0,0175)
    safetyFactor: number;        // Multiplikator (z.B. 1,1 für 10% Zuschlag)
}

const DEFAULT_SETTINGS: CableSizingSettings = {
    maxVoltageDrop: 3.0,
    copperResistivity: 0.0175,
    safetyFactor: 1.1
};

// Standard-Kabelquerschnitte (mm²)
const STANDARD_SIZES = [6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

/**
 * Berechnet den minimalen Kabelquerschnitt
 * Formel: A = (2 × L × I × ρ) / ΔV_max
 */
function calculateCrossSection(
    current: number,
    length: number,
    voltage: number,
    settings: CableSizingSettings
): number {
    const maxVoltageDrop = (voltage * settings.maxVoltageDrop) / 100;
    const crossSection =
        (2 * length * current * settings.copperResistivity) / maxVoltageDrop;

    return crossSection * settings.safetyFactor;
}

/**
 * Rundet auf den nächsten Standard-Querschnitt
 */
function roundToStandardSize(calculated: number): number {
    return STANDARD_SIZES.find(s => s >= calculated) || STANDARD_SIZES[STANDARD_SIZES.length - 1];
}

/**
 * Hauptfunktion: Berechnet alle benötigten Kabelquerschnitte
 */
export function calculateCableRequirements(
    formData: any,
    settings: CableSizingSettings = DEFAULT_SETTINGS
): CableRequirement[] {
    const requirements: CableRequirement[] = [];

    // Parse voltage from string format ("12V", "24V", "48V") to number
    const voltageStr = formData.systemVoltage || '12V';
    const voltage = parseInt(voltageStr.replace('V', '')) || 12;

    const cableLengths = formData.cableLengths || {};

    // 1. Starterbatterie → Ladebooster
    if (formData.energySources?.includes('alternator') && cableLengths.starterToService) {
        // Ladebooster typischerweise 30A (realistischer Wert für Standard-B2B)
        const boosterCurrent = 30;
        const length = cableLengths.starterToService;
        const minCrossSection = calculateCrossSection(boosterCurrent, length, voltage, settings);

        requirements.push({
            route: "starter_to_booster",
            displayName: "Starterbatterie → Ladebooster",
            maxPower: boosterCurrent * voltage,
            voltage,
            current: boosterCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 2. Ladebooster → Versorgerbatterie
    if (formData.energySources?.includes('alternator') && cableLengths.boosterToService) {
        const boosterCurrent = 30;
        const length = cableLengths.boosterToService;
        const minCrossSection = calculateCrossSection(boosterCurrent, length, voltage, settings);

        requirements.push({
            route: "booster_to_service",
            displayName: "Ladebooster → Versorgerbatterie",
            maxPower: boosterCurrent * voltage,
            voltage,
            current: boosterCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 3. Versorgerbatterie → Wechselrichter
    if (formData.consumers?.some((c: any) => c.voltage === '230V') && cableLengths.serviceToInverter) {
        // Berechne Inverter-Leistung aus Verbrauchern
        const total230V = formData.consumers
            .filter((c: any) => c.voltage === '230V')
            .reduce((sum: number, c: any) => sum + (c.watt || 0), 0);

        // Wähle Inverter-Klasse (nächste Standard-Größe, mindestens 25% Puffer)
        const requiredPower = total230V * 1.25;
        const inverterClasses = [800, 1000, 1500, 2000, 2500, 3000, 5000];
        const inverterPower = inverterClasses.find(p => p >= requiredPower) || 3000;

        const inverterCurrent = inverterPower / voltage;
        const length = cableLengths.serviceToInverter;
        const minCrossSection = calculateCrossSection(inverterCurrent, length, voltage, settings);

        requirements.push({
            route: "service_to_inverter",
            displayName: "Versorgerbatterie → Wechselrichter",
            maxPower: inverterPower,
            voltage,
            current: inverterCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 4. Solarmodule → Laderegler
    if (formData.energySources?.includes('solar') && cableLengths.solarToRegulator) {
        // Solar-Strom basierend auf Panel-Leistung
        const solarWp = formData.solarWp || 400; // Fallback
        const solarCurrent = (solarWp / voltage) * 1.25; // 25% Puffer für MPPT
        const length = cableLengths.solarToRegulator;
        const minCrossSection = calculateCrossSection(solarCurrent, length, voltage, settings);

        requirements.push({
            route: "solar_to_regulator",
            displayName: "Solarmodule → Laderegler",
            maxPower: solarWp,
            voltage,
            current: solarCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 5. Laderegler → Versorgerbatterie
    if (formData.energySources?.includes('solar') && cableLengths.serviceToRegulator) {
        // Gleicher Strom wie Solarseite (oder leicht weniger, aber konservativ gleich rechnen)
        const solarWp = formData.solarWp || 400;
        const regulatorCurrent = (solarWp / voltage) * 1.25;
        const length = cableLengths.serviceToRegulator;
        const minCrossSection = calculateCrossSection(regulatorCurrent, length, voltage, settings);

        requirements.push({
            route: "service_to_regulator",
            displayName: "Solar-Laderegler → Versorgerbatterie",
            maxPower: solarWp,
            voltage,
            current: regulatorCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 6. Landstrom-Ladegerät → Versorgerbatterie
    if (formData.energySources?.includes('shore_power') && cableLengths.chargerToService) {
        // Standard-Ladegerät: ~20A bei 12V (oder 30A)
        const chargerCurrent = 30; // Konservativ
        const length = cableLengths.chargerToService;
        const minCrossSection = calculateCrossSection(chargerCurrent, length, voltage, settings);

        requirements.push({
            route: "charger_to_service",
            displayName: "Landstrom-Ladegerät → Versorgerbatterie",
            maxPower: chargerCurrent * voltage,
            voltage,
            current: chargerCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    // 5. Versorgerbatterie → Sicherungskasten
    if (cableLengths.batteryToFuseBox) {
        // Hauptabgang: Höchsten Einzelverbraucher + Summe anderer nehmen
        const consumersExcluding230V = formData.consumers?.filter((c: any) => c.voltage !== '230V') || [];
        const totalDCCurrent = consumersExcluding230V.reduce((sum: number, c: any) => {
            const watt = c.watt || 0;
            return sum + (watt / voltage);
        }, 0);

        const fuseBoxCurrent = totalDCCurrent * 1.2; // 20% Puffer
        const length = cableLengths.batteryToFuseBox;
        const minCrossSection = calculateCrossSection(fuseBoxCurrent, length, voltage, settings);

        requirements.push({
            route: "battery_to_fusebox",
            displayName: "Versorgerbatterie → Sicherungskasten",
            maxPower: fuseBoxCurrent * voltage,
            voltage,
            current: fuseBoxCurrent,
            length,
            minCrossSection,
            recommendedCrossSection: roundToStandardSize(minCrossSection)
        });
    }

    return requirements;
}

/**
 * Formatiert die Kabelanforderungen für den AI-Prompt
 */
export function formatCableRequirementsForAI(requirements: CableRequirement[]): string {
    if (requirements.length === 0) {
        return "Keine Kabelberechnung erforderlich (keine Distanzen angegeben).";
    }

    const sections = requirements.map(req => `
### ${req.displayName}
- **Strecke:** ${req.length} m
- **Maximaler Strom:** ${Math.round(req.current)} A (${req.maxPower}W @ ${req.voltage}V)
- **Berechneter Querschnitt:** ${req.minCrossSection.toFixed(1)} mm²
- **Empfohlenes Kabel:** **${req.recommendedCrossSection} mm²**
`).join('\n');

    return `## KABEL-ANFORDERUNGEN (bereits berechnet)

Die folgenden Kabelquerschnitte wurden basierend auf den Systemkomponenten und den eingegebenen Distanzen elektrotechnisch berechnet:

${sections}

**WICHTIG FÜR DICH:** 
- Wähle NUR Kabel mit dem **empfohlenen Querschnitt** (oder größer)!
- Die Länge muss zur angegebenen Strecke passen (±0,5m Toleranz ist okay)
- Du musst NICHT selbst rechnen – die Werte sind bereits korrekt berechnet!

**Deine Aufgabe:**
Suche in der Produktliste nach Kabeln, die diese Anforderungen erfüllen, und gib eine ausführliche Begründung (2 Sätze).
`;
}
