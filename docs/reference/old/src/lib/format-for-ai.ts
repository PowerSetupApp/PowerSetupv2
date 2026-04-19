/**
 * Transforms wizard formData JSON into human-readable German text for AI prompts.
 * This ensures the AI understands context, units, and relationships.
 */

interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number;
    voltage: 12 | 24 | 48 | 230;
    usageHoursPerDay: number;
    usage: string;
    isFixed?: boolean;
    coolingMethod?: 'compressor' | 'absorber';
}

interface TravelBehavior {
    season: string;
    tripDuration: string;
    winterLocation: string;
    standingDuration: string;
}

interface SolarDimensions {
    length: number;
    width: number;
}

interface RoofArea {
    id: string;
    name: string;
    length: number;
    width: number;
}

interface SolarBag {
    id: string;
    power: number;
}

interface CableLengths {
    starterToService: number;
    boosterToService?: number;
    serviceToInverter: number;
    solarToRegulator: number;
    serviceToRegulator?: number;
    chargerToService?: number;
    boiler?: number;
    waterPump?: number;
    batteryToFuseBox?: number;
    custom: Record<string, number>;
}

interface FormData {
    vehicleType: string | null;
    vehicleVoltage: 12 | 24; // New field
    systemVoltage: 12 | 24 | 48;
    energySources: string[];
    consumers: Consumer[];
    autarchyGoal: string;
    autarchyDays: number;
    solarSetupType: string;
    solarDimensions: SolarDimensions | null;
    roofAreas?: RoofArea[];
    roofModuleType: string;
    solarModulePreference: string | null;
    solarBags: SolarBag[];
    cableLengths: CableLengths;
    comfortLevel: string;
    schematicPreference: string;
    batteryPreference: string;
    travelBehavior: TravelBehavior;
    // New AI-relevant fields
    simultaneousLoad?: string;
    alternatorSize?: string;
    batterySpaceSize?: string;
    // Brand Preferences
    brandPreferenceCharger?: string | null;
    brandPreferenceBattery?: string | null;
    // Custom User Overrides
    customBatteryCapacity?: number | null;
    customSolarPower?: number | null;
    // Algorithm calculated values
    recommendedCapacityAh?: number | null;
    calculatedDailyWh?: number | null;
}

// Translation maps for German text output
const VEHICLE_TYPES: Record<string, string> = {
    campervan: 'Campervan / Kastenwagen',
    motorhome: 'Wohnmobil (Integriert/Teilintegriert)',
    caravan: 'Wohnwagen / Caravan',
    boat: 'Boot / Segelboot',
    offroad: 'Offroad / Expeditionsfahrzeug',
};

const ENERGY_SOURCES: Record<string, string> = {
    solar: 'Solarmodule',
    alternator: 'Ladebooster (Lichtmaschine)',
    shore_power: 'Landstrom (230V)',
    generator: 'Generator',
};

const AUTARCHY_GOALS: Record<string, string> = {
    weekend: 'Wochenendtrips (2-3 Tage)',
    holiday: 'Urlaubsreisen (5-7 Tage)',
    full: 'Vollautarkie (14+ Tage)',
};

const COMFORT_LEVELS: Record<string, string> = {
    budget: 'Budget (günstig, funktional)',
    standard: 'Standard (gutes Preis-Leistungs-Verhältnis)',
    premium: 'Premium (hochwertig, langlebig)',
};

const BATTERY_TYPES: Record<string, string> = {
    agm: 'AGM-Batterie',
    lifepo4: 'LiFePO4 (Lithium)',
    gel: 'Gel-Batterie',
    any: 'Keine Präferenz (KI entscheidet)',
};

const SCHEMATIC_TYPES: Record<string, string> = {
    simplified: 'Vereinfacht (bunte Icons, leicht verständlich)',
    technical: 'Technisch (normgerecht, DIN-Symbole)',
};

const SOLAR_SETUP_TYPES: Record<string, string> = {
    roof: 'Dachinstallation',
    portable: 'Mobile Solartaschen',
    mixed: 'Kombination (Dach + Mobil)',
};

const ROOF_MODULE_TYPES: Record<string, string> = {
    rigid: 'Starr (Glasmodule)',
    flexible: 'Flexibel (dünnschicht)',
};

const USAGE_LEVELS: Record<string, string> = {
    low: 'Wenig (1-2h/Tag)',
    medium: 'Normal (3-5h/Tag)',
    high: 'Viel (6-12h/Tag)',
    constant: 'Dauerbetrieb (24h)',
};

const TRAVEL_SEASONS: Record<string, string> = {
    summer_only: 'Nur Sommer',
    all_year: 'Ganzjährig',
    winter_focused: 'Schwerpunkt Winter',
};

const TRIP_DURATIONS: Record<string, string> = {
    weekend: 'Wochenendtrips',
    week: 'Wochenreisen',
    extended: 'Längere Reisen (2-4 Wochen)',
    permanent: 'Dauerhaft unterwegs',
};

const WINTER_LOCATIONS: Record<string, string> = {
    germany_alps: 'Deutschland / Alpen',
    southern_europe: 'Südeuropa (Spanien, Portugal)',
    scandinavia: 'Skandinavien',
    varies: 'Wechselnd / Unbestimmt',
};

const STANDING_DURATIONS: Record<string, string> = {
    short: 'Kurz (1-2 Nächte)',
    medium: 'Mittel (3-5 Nächte)',
    long: 'Lang (1 Woche+)',
};

// New: AI-relevant fields
const SIMULTANEOUS_LOADS: Record<string, string> = {
    low: 'Wenige Geräte gleichzeitig (Grundlast ~200-500W)',
    moderate: 'Moderate Gleichzeitigkeit (~500-1500W)',
    high: 'Viele Geräte gleichzeitig (~1500-3000W Spitze)',
};

const ALTERNATOR_SIZES: Record<string, string> = {
    standard: 'Standard-Lichtmaschine (90-120A)',
    enhanced: 'Verstärkte Lichtmaschine (150-180A)',
    euro6d_smart: 'Euro 6d / Smart Generator (variable Ladung)',
    unknown: 'Unbekannt (konservativ rechnen)',
};

const BATTERY_SPACE_SIZES: Record<string, string> = {
    compact: 'Kompakter Einbauraum (max ~30×20×20cm)',
    medium: 'Mittlerer Einbauraum (bis ~40×30×25cm)',
    spacious: 'Großzügiger Einbauraum (keine Beschränkung)',
};

/**
 * Main function: Transforms formData to human-readable German text
 */
export function formatFormDataForAI(data: FormData): string {
    const sections: string[] = [];

    // --- Section 1: Vehicle & Basic Setup ---
    sections.push('## FAHRZEUG & GRUNDEINSTELLUNG');
    // Only show vehicle type if explicitly set (wizard no longer asks for it)
    if (data.vehicleType) {
        sections.push(`Fahrzeugtyp: ${VEHICLE_TYPES[data.vehicleType] || data.vehicleType}`);
    }
    sections.push(`Fahrzeugspannung (Starterbatterie): ${data.vehicleVoltage || '12V'}`);
    sections.push(`Systemspannung (Aufbau): ${data.systemVoltage}`);
    sections.push(`Batterietyp-Präferenz: ${BATTERY_TYPES[data.batteryPreference] || 'Keine Angabe'}`);

    // Recommended battery capacity from algorithm
    if (data.recommendedCapacityAh) {
        sections.push(`Empfohlene Batteriekapazität: ${data.recommendedCapacityAh} Ah`);
    }

    if (data.batterySpaceSize) {
        sections.push(`Batterie-Einbauraum: ${BATTERY_SPACE_SIZES[data.batterySpaceSize] || data.batterySpaceSize}`);
    }
    // Custom User Override: Battery Capacity
    if (data.customBatteryCapacity) {
        sections.push(`\n**⚠️ NUTZER-VORGABE Batteriekapazität:** ${data.customBatteryCapacity} Ah`);
        sections.push(`→ Der Nutzer hat EXPLIZIT ${data.customBatteryCapacity}Ah als gewünschte Kapazität angegeben!`);
        sections.push(`→ Wähle eine Batterie mit MINDESTENS dieser Kapazität!`);
        sections.push(`→ **FALLS KEINE EINZELNE BATTERIE MIT DIESER KAPAZITÄT VERFÜGBAR IST:**`);
        sections.push(`  - Wähle die größte verfügbare Batterie und empfehle MEHRERE STÜCK (Parallelschaltung)`);
        sections.push(`  - Beispiel: Benötigt ${data.customBatteryCapacity}Ah, größte verfügbar 200Ah → empfehle "2x 200Ah Batterie"`);
        sections.push(`  - Setze quantity entsprechend (z.B. quantity: 2 für zwei parallele Batterien)`);
        sections.push(`  - Erkläre im reason-Feld, warum mehrere Batterien empfohlen werden`);
    }

    // --- Section 2: Energy Sources ---
    sections.push('\n## ENERGIEQUELLEN');
    if (data.energySources.length === 0) {
        sections.push('Keine Energiequellen ausgewählt');
    } else {
        data.energySources.forEach((source) => {
            sections.push(`• ${ENERGY_SOURCES[source] || source}`);
        });
        // Alternator size if alternator is selected
        if (data.energySources.includes('alternator') && data.alternatorSize) {
            sections.push(`  → Lichtmaschine: ${ALTERNATOR_SIZES[data.alternatorSize] || data.alternatorSize}`);
        }
    }

    // --- Section 3: Consumers ---
    sections.push('\n## VERBRAUCHER');
    if (data.consumers.length === 0) {
        sections.push('Keine Verbraucher konfiguriert');
    } else {
        // Calculate totals
        const totalWattage = data.consumers.reduce((sum, c) => sum + c.power, 0);

        // Use pre-calculated daily Wh if available (includes correct duty cycles), otherwise fallback to naive sum
        const totalWhPerDay = data.calculatedDailyWh
            ? data.calculatedDailyWh
            : data.consumers.reduce((sum, c) => sum + (c.power * c.usageHoursPerDay), 0);

        sections.push(`Gesamtleistung aller Verbraucher: ${totalWattage} Watt`);
        sections.push(`Geschätzter Tagesbedarf: ${totalWhPerDay.toFixed(0)} Wh/Tag`);
        sections.push('');

        // Group by category
        const byCategory = data.consumers.reduce((acc, c) => {
            const cat = c.category || 'sonstige';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(c);
            return acc;
        }, {} as Record<string, Consumer[]>);

        Object.entries(byCategory).forEach(([category, consumers]) => {
            sections.push(`### ${category.toUpperCase()}`);
            consumers.forEach((c) => {
                let line = `• ${c.name}: ${c.power}W @ ${c.voltage}`;

                if (c.coolingMethod) {
                    line += c.coolingMethod === 'compressor' ? ', Kompressor-Kühlung' : ', Absorber-Kühlung';
                } else if (c.usageHoursPerDay) {
                    line += `, ${c.usageHoursPerDay}h/Tag`;
                }

                if (c.isFixed) {
                    line += ' [FEST INSTALLIERT]';
                }

                sections.push(line);
            });
            sections.push('');
        });

        // Simultaneous load info
        if (data.simultaneousLoad) {
            sections.push(`Gleichzeitige Last: ${SIMULTANEOUS_LOADS[data.simultaneousLoad] || data.simultaneousLoad}`);
        }
    }

    // --- Section 4: Travel Behavior ---
    sections.push('\n## REISEVERHALTEN');
    sections.push(`Reisesaison: ${TRAVEL_SEASONS[data.travelBehavior?.season] || 'Nicht angegeben'}`);
    sections.push(`Typische Reisedauer: ${TRIP_DURATIONS[data.travelBehavior?.tripDuration] || 'Nicht angegeben'}`);
    sections.push(`Winterstandort: ${WINTER_LOCATIONS[data.travelBehavior?.winterLocation] || 'Nicht angegeben'}`);
    sections.push(`Standdauer pro Ort: ${STANDING_DURATIONS[data.travelBehavior?.standingDuration] || 'Nicht angegeben'}`);

    // --- Section 5: Autarchy Goal ---
    sections.push('\n## AUTARKIE-ZIEL');
    sections.push(`Ziel: ${AUTARCHY_GOALS[data.autarchyGoal] || data.autarchyGoal}`);
    sections.push(`Gewünschte Autonomie: ${data.autarchyDays} Tage ohne externe Stromquelle`);

    // --- Section 6: Solar Configuration ---
    if (data.energySources.includes('solar')) {
        sections.push('\n## SOLAR-KONFIGURATION');
        sections.push(`Setup-Typ: ${SOLAR_SETUP_TYPES[data.solarSetupType] || data.solarSetupType}`);

        // Use roofAreas if available, otherwise fallback to legacy solarDimensions
        if (data.roofAreas && data.roofAreas.length > 0) {
            let totalAreaM2 = 0;
            const dimensionsList: string[] = [];

            data.roofAreas.forEach(area => {
                const areaM2 = (area.length * area.width) / 10000;
                totalAreaM2 += areaM2;
                sections.push(`Verfügbare Dachfläche (${area.name}): ${area.length}cm × ${area.width}cm (${areaM2.toFixed(2)}m²)`);
                dimensionsList.push(`${area.length}cm × ${area.width}cm`);
            });

            // Add explicit dimension constraints for AI
            sections.push(`\n**⚠️ SOLARMODUL-AUSWAHL (KRITISCH - DIMENSIONSPRÜFUNG):**`);
            sections.push(`→ Die **maximalen Modulabmessungen** sind definiert durch die einzelnen Flächen:`);
            data.roofAreas.forEach((area) => {
                sections.push(`  - Fläche "${area.name}": max. ${area.length}cm × ${area.width}cm`);
            });
            sections.push(`→ BEVOR du ein Solarmodul empfiehlst, prüfe IMMER, ob es auf MINDESTENS EINE der Flächen passt.`);
            sections.push(`→ Nur Module empfehlen, die PHYSISCH auf die jeweilige Fläche passen.`);
            sections.push(`→ **MEHRERE MODULE:** Du kannst mehrere Module auf verschiedene Flächen verteilen.`);
            sections.push(`→ **KRITISCH - IDENTISCHE MODULE:** An einem Solar-Laderegler dürfen NUR identische Module angeschlossen werden!`);
            sections.push(`   - Wenn du 2 verschiedene Modultypen empfiehlst, brauchst du auch 2 separate Laderegler!`);
            sections.push(`   - Beispiel: 2x 200Wp gleiche Module → 1 Laderegler OK`);
            sections.push(`   - Beispiel: 1x 400Wp + 1x 200Wp verschiedene → 2 separate Laderegler nötig!`);
        } else if (data.solarDimensions) {
            const roofLength = data.solarDimensions.length;
            const roofWidth = data.solarDimensions.width;
            const area = (roofLength * roofWidth) / 10000;
            sections.push(`Verfügbare Dachfläche: ${roofLength}cm × ${roofWidth}cm (${area.toFixed(2)}m²)`);

            // Add explicit dimension constraints for AI
            sections.push(`\n**⚠️ SOLARMODUL-AUSWAHL (KRITISCH - DIMENSIONSPRÜFUNG):**`);
            sections.push(`→ Die **maximalen Modulabmessungen** sind: ${roofLength}cm × ${roofWidth}cm`);
            sections.push(`→ BEVOR du ein Solarmodul empfiehlst, prüfe IMMER dessen Abmessungen!`);
            sections.push(`→ Nur Module empfehlen, die PHYSISCH auf das Dach passen.`);
            sections.push(`→ Wähle das Modul, das die Dachfläche OPTIMAL ausnutzt (höchste Wp bei passenden Maßen).`);
            sections.push(`→ **MEHRERE MODULE:** Nur wenn sie ZUSAMMEN auf die Fläche passen.`);
            sections.push(`   Beispiel: 2x Module (je 100cm × 50cm) = 100cm × 100cm → passt auf 200cm × 100cm`);
            sections.push(`   Beispiel: 2x Module (je 160cm × 80cm) = 160cm × 160cm → passt NICHT auf 200cm × 100cm!`);
            sections.push(`→ **KRITISCH - IDENTISCHE MODULE:** An einem Solar-Laderegler dürfen NUR identische Module angeschlossen werden!`);
            sections.push(`   - Wenn du 2 verschiedene Modultypen empfiehlst, brauchst du auch 2 separate Laderegler!`);
        }

        sections.push(`Modultyp Präferenz: ${ROOF_MODULE_TYPES[data.roofModuleType] || data.roofModuleType}`);

        if (data.solarBags.length > 0) {
            const totalPortable = data.solarBags.reduce((sum, b) => sum + b.power, 0);
            sections.push(`Mobile Solartaschen: ${data.solarBags.length} Stück, gesamt ${totalPortable}Wp`);
            data.solarBags.forEach((bag, i) => {
                sections.push(`  • Tasche ${i + 1}: ${bag.power}Wp`);
            });
        }
    }

    // --- Section 7: Cable Lengths ---
    sections.push('\n## KABELLÄNGEN');

    if (data.energySources.includes('alternator')) {
        sections.push(`Starterbatterie → Ladebooster: ${data.cableLengths.starterToService} Meter`);
        sections.push(`Ladebooster → Versorgerbatterie: ${data.cableLengths.boosterToService || 1} Meter`);
    } else if (data.cableLengths.starterToService > 0) {
        sections.push(`Starterbatterie → Versorgerbatterie: ${data.cableLengths.starterToService} Meter`);
    }

    const consumersRequire230V = data.consumers.some(c => c.voltage === 230);
    if (consumersRequire230V) {
        sections.push(`Versorgerbatterie → Wechselrichter: ${data.cableLengths.serviceToInverter} Meter`);
    }

    if (data.energySources.includes('solar')) {
        sections.push(`Solarmodule → Laderegler: ${data.cableLengths.solarToRegulator} Meter`);
    }


    if (data.cableLengths.batteryToFuseBox) {
        sections.push(`Versorgerbatterie ↔ Sicherungskasten: ${data.cableLengths.batteryToFuseBox} Meter`);
    }

    if (data.cableLengths.serviceToRegulator) {
        sections.push(`Solar-Laderegler ↔ Versorgerbatterie: ${data.cableLengths.serviceToRegulator} Meter`);
    }

    // Custom cable lengths
    if (Object.keys(data.cableLengths.custom).length > 0) {
        sections.push('Individuelle Kabel:');
        Object.entries(data.cableLengths.custom).forEach(([id, length]) => {
            sections.push(`  • ${id}: ${length} Meter`);
        });
    }

    // --- Section: Requirements Checklist & Upgrades ---
    // Analyzes the setup to guide the AI on what is strictly necessary vs. optional upgrades
    sections.push('\n## SYSTEM-ANFORDERUNGEN & UPGRADE-OPTIONEN');

    const has230V = data.consumers.some(c => c.voltage === 230);
    const hasSolar = data.energySources.includes('solar');
    const hasAlternator = data.energySources.includes('alternator');
    const hasShorePower = data.energySources.includes('shore_power');

    // MUSS-Anforderungen (Must Have)
    // We add the valid JSON category slug in brackets to help the AI map it.
    const mustHave: string[] = ['Batterie (category: battery)'];
    if (has230V) mustHave.push('Wechselrichter (category: inverter)');

    if (hasSolar) {
        // Solar specific rules based on setup type
        const type = data.solarSetupType || 'roof'; // default to roof if missing

        if (type === 'roof' || type === 'mixed') {
            mustHave.push('Solar-Laderegler (category: solar_controller)');
            mustHave.push('Solarmodule (category: solar_module)');
        }

        if (type === 'portable' || type === 'mixed') {
            mustHave.push('Faltbare Solartaschen (category: solartaschen)');
            // Usually portable panels have integrated controllers, but if separate:
            if (type === 'portable') {
                mustHave.push('Solar-Laderegler (category: solar_controller)');
            }
        }
    }

    if (hasAlternator) mustHave.push('Ladebooster (category: ladebooster)');
    if (hasShorePower) mustHave.push('Ladegerät (category: charger)');

    // Always require cables if lengths are present (which they usually are in this step)
    // We check if any cable length is > 0
    const hasCables = Object.values(data.cableLengths).some(val =>
        (typeof val === 'number' && val > 0) || (typeof val === 'object' && Object.values(val as Record<string, number>).some((v: number) => v > 0))
    );
    if (hasCables) {
        mustHave.push('Kabel & Montagematerial (category: cable)');
    }

    sections.push('**MUSS-Komponenten (Erforderlich):**');
    mustHave.forEach(item => sections.push(`- [MUSS] ${item}`));


    // KANN-Anforderungen (Nice to Have / Upgrades)
    sections.push('\n**KANN-Komponenten (Sinnvolle Upgrades):**');
    const niceToHave: string[] = [];

    // Optional Inverter - REMOVED based on user feedback (too aggressive)
    // if (!has230V) {
    //    niceToHave.push('Wechselrichter: Für Flexibilität, falls später 230V Geräte genutzt werden sollen.');
    // }

    // Optional Solar
    if (!hasSolar) {
        niceToHave.push('Solar-Setup: Erhöht die Autarkie enorm, besonders bei längeren Standzeiten.');
    }

    // Optional Booster
    if (!hasAlternator) {
        niceToHave.push('Ladebooster: Ermöglicht schnelles Laden während der Fahrt.');
    }

    // Optional Charger
    if (!hasShorePower) {
        niceToHave.push('Ladegerät: Sicherheit an Campingplätzen oder zu Hause vor der Reise.');
    }

    if (niceToHave.length === 0) {
        sections.push('- Keine weiteren Upgrades notwendig.');
    } else {
        niceToHave.forEach(item => sections.push(`- [OPTION] ${item}`));
    }

    // --- Section 8: Preferences ---
    sections.push('\n## PRÄFERENZEN');
    sections.push(`Komfort-Level: ${COMFORT_LEVELS[data.comfortLevel] || data.comfortLevel}`);
    sections.push(`Schaltplan-Stil: ${SCHEMATIC_TYPES[data.schematicPreference] || data.schematicPreference}`);

    // Brand Preferences (NEW)
    if (data.brandPreferenceCharger) {
        sections.push(`Bevorzugte Marke (Ladeelektronik): ${data.brandPreferenceCharger}`);
    }
    if (data.brandPreferenceBattery) {
        sections.push(`Bevorzugte Marke (Batterien): ${data.brandPreferenceBattery}`);
    }

    // --- Section 9: AI Rules & Exclusions (Universal) ---
    // These rules are injected here to ensure they override any weak instructions in the user's prompt template.
    sections.push('\n## WICHTIGE ENTSCHEIDUNGS-REGELN FÜR DIE KI (PRIORITÄT HOCH)');

    // 1. Universal Exclusion Rule
    sections.push('**1. UNIVERSAL-AUSSCHLUSS (Gilt für ALLE Kategorien):**');
    sections.push('- Eine Komponente darf NUR gewählt werden, wenn die zugehörige Energiequelle oder der Verbrauchertyp explizit im Profil gelistet ist.');
    sections.push('- Bevor du ein Produkt wählst, prüfe: Braucht dieses System das wirklich?');

    // NEW: Fallback Rule
    sections.push('- **KEINE KOMPROMISSE BEI TECHNISCHEN REGELN:**');
    sections.push('  - Wenn für eine benötigte Kategorie kein passendes Produkt existiert (z.B. falsche Spannung), wähle **NICHTS** aus.');
    sections.push('  - Füge die Kategorie stattdessen zur Liste `missingCategories` hinzu.');
    sections.push('  - Wähle NIEMALS ein inkompatibles Produkt, nur um "irgendwas" zu haben.');
    sections.push('  - **GILT AUCH FÜR ALTERNATIVEN:** Empfehle KEINE Alternative, wenn sie technisch nicht passt (z.B. falsche Spannung). Lieber keine Alternative als eine kaputte.');
    sections.push('  - **VERBOT:** Liste KEINE inkompatiblen Produkte auf, nur um zu zeigen, dass es sie gibt. Wenn es nicht passt, gehört die ID NICHT in das JSON!');

    // NEW: Recommendation Flag Rule
    sections.push('  - **WICHTIG FÜR JSON-OUTPUT:**');
    sections.push('  - Wenn eine Komponente oben als **[MUSS]** gelistet ist, MUSST du im JSON `isRecommended: true` setzen.');
    sections.push('  - Das Feld `isRecommended` entscheidet über die Anzeige. Setze es mit Sorgfalt!');

    // Specific Triggers
    const needsInverter = data.consumers.some(c => c.voltage === 230);
    if (!needsInverter) {
        sections.push('- **WECHSELRICHTER-SPERRE:** Es sind KEINE 230V-Verbraucher gelistet -> Empfehle KEINEN Wechselrichter! (Auch nicht als "Nice-to-Have").');
    } else {
        sections.push('- **KABEL-DIMENSIONIERUNG WECHSELRICHTER (CRITICAL):**');
        sections.push('  - Berechne das Kabel von der Batterie zum Wechselrichter **EXAKT** basierend auf der **DAUERLEISTUNG DES GEWÄHLTEN INVERTERS**!');
        sections.push('  - Beispiel: Gewählter Inverter hat 500W -> Kabel für 500W berechnen.');
        sections.push('  - Beispiel: Gewählter Inverter hat 3000W -> Kabel für 3000W berechnen.');
        sections.push('  - Ignoriere den aktuellen Verbraucher-Wert, falls dieser niedriger ist.');
        sections.push('  - **WICHTIG:** Überdimensioniere NICHT für "einen späteren stärkeren Wechselrichter". Berechne nur für das HIER gewählte Gerät!');
    }


    if (!data.energySources.includes('solar')) {
        sections.push('- **SOLAR-SPERRE:** Kein Solar als Energiequelle gewählt -> Empfehle KEINE Laderegler und KEINE Module!');
    } else if (data.solarSetupType === 'mixed') {
        sections.push('- **SOLAR-LADEREGLER:** Bei "mixed" Setup (Dach + Mobil) empfehle bitte **ZWEI** Laderegler:');
        sections.push('  1. Einen für die Dachmodule (fest).');
        sections.push('  2. Einen für die faltbare Solartasche (mobil).');
        sections.push('  - Setze für BEIDE `isRecommended: true`.');
    }

    // SOLARMODUL-REGELN (Neu)
    if (data.energySources.includes('solar') && (data.solarSetupType === 'roof' || data.solarSetupType === 'mixed')) {
        sections.push('- **SOLARMODUL-AUSWAHL (KRITISCH):**');
        sections.push('  - **STRATEGIE:** Wähle IMMER identische Module wenn möglich! (z.B. 2x das gleiche Modul).');
        sections.push('  - **VERMEIDE:** Mische NIEMALS verschiedene Modultypen an einem Regler!');
        sections.push('  - **ANZAHL-LOGIK:**');
        sections.push('    - **BEST PRACTICE:** Nimm 2x (oder mehr) vom SELBEN Modul, um auf die Leistung zu kommen.');
        sections.push('      → Dann reicht **1** passender großer Laderegler.');
        sections.push('    - **NOTLÖSUNG:** Wenn du verschiedene Module mischst (z.B. 1x groß, 1x klein), MUSST du für JEDES Modul einen EIGENEN Laderegler empfehlen!');
        sections.push('  - **BEISPIEL PERFEKT:** 2x 500W (identisch) + 1x Solarregler (passend für 1000W)');
        sections.push('  - **BEISPIEL PERFEKT:** 2x 460W (identisch) + 1x Solarregler (passend für 920W)');
        sections.push('  - **BEISPIEL KOMPLEX (VERMEIDEN):** 1x 500W + 1x 460W → Braucht 2 separate Regler! (Teuer & Kompliziert)');
    }

    // 2. SPANNUNGS-REGELN
    sections.push(`\n**2. SPANNUNGS-REGELN (${data.systemVoltage} System):**`);
    sections.push(`- Das Bordnetz ist strikt **${data.systemVoltage}**.`);
    sections.push(`- Wähle KEINE Produkte mit falscher Spannung (z.B. keine 12V Geräte in 24V System), es sei denn es ist ein Wandler.`);

    // 3. BUDGET & PRIORITY RULES
    if (data.comfortLevel === 'budget') {
        sections.push('\n**3. BUDGET-PRIORITÄT (Unteres Preissegment):**');
        sections.push('- Der Nutzer hat **"Budget"** gewählt.');
        sections.push('- **OBERSTE REGEL:** Wähle das **günstigste** Produkt, das die technischen Mindestanforderungen erfüllt.');
        sections.push('- **Verzicht:** Features wie Bluetooth, Apps oder Displays sind unwichtig, wenn sie Aufpreis kosten.');
        sections.push('- **Kapazität:** Überdimensioniere NICHT! Eine Batterie, die den Bedarf "gerade so" deckt (Tagesbedarf + 10%), ist GENAU RICHTIG.');
        sections.push('- **Ziel:** Ein funktionierendes System zum absoluten Minimalpreis.');
    } else if (data.comfortLevel === 'premium') {
        sections.push('\n**3. PREMIUM-PRIORITÄT (Oberes Preissegment):**');
        sections.push('- Der Nutzer hat **"Premium"** gewählt.');
        sections.push('- **OBERSTE REGEL:** Wähle das **beste & leistungsfähigste** Produkt. Der Preis ist zweitrangig.');
        sections.push('- **Features:** Bevorzuge Produkte mit Smart-Features (Bluetooth, App, Display), hoher Effizienz (MPPT) und bekannten Marken.');
        sections.push('- **Kapazität:** Plane großzügige Reserven ein (mind. 30-50% Puffer). "Besser zu viel als zu wenig".');
        sections.push('- **Ziel:** Maximaler Komfort, Langlebigkeit und High-End Technik.');
    } else {
        sections.push('\n**3. STANDARD-PRIORITÄT (Mittelklasse - Preis/Leistung):**');
        sections.push('- Der Nutzer hat **"Standard"** gewählt.');
        sections.push('- **OBERSTE REGEL:** Wähle den **Preis-Leistungs-Sieger**.');
        sections.push('- Meide das allerbilligste "Billig-Produkt", wenn es qualitativ schlechter wirkt, aber nimm auch nicht das teure High-End Gerät.');
        sections.push('- **Kapazität:** Plane einen vernünftigen Puffer ein (~20%), aber übertreibe es nicht.');
        sections.push('- **Ziel:** Solide, zuverlässige Technik zu einem fairen Preis.');
    }

    // 3. Ladebooster Special Case (Voltage conversion)
    if (data.energySources.includes('alternator')) {
        const vVehicle = data.vehicleVoltage || '12V';
        const vSystem = data.systemVoltage;

        sections.push('\n**3. SONDERFALL LADEBOOSTER (WICHTIG - SPANNUNGSMATCHING):**');
        sections.push(`- Ausgangssituation: Fahrzeug/Lichtmaschine hat **${vVehicle}**, Aufbaubatterie hat **${vSystem}**.`);

        if (vVehicle !== vSystem) {
            sections.push(`- **ACHTUNG WANDLUNG NÖTIG:** Du MUSST einen Ladebooster wählen, der von **${vVehicle}** (Input) auf **${vSystem}** (Output) lädt.`);
            sections.push(`- Ein Standard "12V auf 12V" Booster ist hier **FALSCH**!`);
            sections.push(`- Suche nach Produkten mit Titel wie "${vVehicle} auf ${vSystem}" oder checke die Specs.`);
        } else {
            sections.push(`- Spannung ist gleich (${vVehicle}). Wähle einen Standard ${vVehicle}-Ladebooster.`);
        }
    }


    if (data.systemVoltage === 24 && data.consumers.some(c => c.voltage === 12 || c.category === 'usb')) {
        sections.push('4. **DC-DC Wandler:** Da 12V/USB Verbraucher vorhanden sind, aber das System 24V hat, beachte dies bei der Konzept-Erstellung (ggf. Hinweis auf Wandler).');
    }

    return sections.join('\n');
}

/**
 * Compact version for shorter prompts (key facts only)
 */
export function formatFormDataCompact(data: FormData): string {
    const parts: string[] = [];

    // Only include vehicle type in compact summary if explicitly set
    if (data.vehicleType && VEHICLE_TYPES[data.vehicleType]) {
        parts.push(`Fahrzeug: ${VEHICLE_TYPES[data.vehicleType]}, ${data.systemVoltage}V`);
    } else {
        parts.push(`System: ${data.systemVoltage}V`);
    }
    parts.push(`Batterie: ${BATTERY_TYPES[data.batteryPreference] || 'Keine Präferenz'}`);
    parts.push(`Energiequellen: ${data.energySources.map(s => ENERGY_SOURCES[s] || s).join(', ') || 'Keine'}`);

    // Use the smart calculated daily consumption if available (from algorithm),
    // otherwise fallback to naive sum (which ignores duty cycles like fridge 30%)
    const dailyWh = data.calculatedDailyWh || data.consumers.reduce((sum, c) => {
        return sum + (c.power * c.usageHoursPerDay);
    }, 0);
    parts.push(`Verbraucher: ${data.consumers.length} Geräte, ~${dailyWh.toFixed(0)} Wh/Tag`);

    parts.push(`Autarkie: ${data.autarchyDays} Tage, ${COMFORT_LEVELS[data.comfortLevel] || data.comfortLevel}`);

    return parts.join(' | ');
}

/**
 * Formats a list of products for AI context
 */
export interface AIProductContext {
    id: string;
    name: string;
    category: { name: string; slug: string };
    price: number | null;
    specs: string | null;
    imageUrl?: string | null;
}

export function formatProductsForAI(products: AIProductContext[]): string {
    return products.map(p => {
        let specsFormatted = '_Keine Spezifikationen hinterlegt_';

        if (p.specs) {
            // Try to parse if it's a JSON string, otherwise use as is
            if (typeof p.specs === 'string' && (p.specs.startsWith('{') || p.specs.startsWith('['))) {
                try {
                    const parsed = JSON.parse(p.specs);
                    specsFormatted = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    specsFormatted = p.specs;
                }
            } else if (typeof p.specs === 'object') {
                // Should not happen given the type definition but safe to handle
                specsFormatted = JSON.stringify(p.specs, null, 2);
            } else {
                specsFormatted = String(p.specs);
            }
        }

        // Downgrade headers in specifications to prevent messing up the prompt structure
        // # Spec -> #### Spec (H4)
        // ## Spec -> ##### Spec (H5)
        // This ensures the product specs are nested under the Product Info (which is H2, with Specs header H3)
        if (typeof specsFormatted === 'string') {
            // Remove OpenAI/ChatGPT citation artifacts
            specsFormatted = specsFormatted.replace(/:contentReference\[oaicite:\d+\]\{index=\d+\}/g, '');

            // Downgrade headers
            specsFormatted = specsFormatted.replace(/^(#+)/gm, '###$1');
        }

        return `## Produkt-ID: ${p.id}
**Name:** ${p.name}
**Kategorie:** ${p.category.slug} (${p.category.name})
**Preis:** ${p.price ? p.price + ' €' : 'Kein Preis'}
**Bild-URL:** ${p.imageUrl || 'Kein Bild verfügbar'}

### Spezifikationen
${specsFormatted}

---`;
    }).join('\n\n');
}

/**
 * Formats pre-calculated system requirements for AI prompt.
 * CRITICAL: This tells the AI NOT to recalculate but to use these values for product matching.
 */
export interface SystemRequirementsForAI {
    dailyWh: number;
    battery: {
        minCapacityAh: number;
        recommendedCapacityAh?: number; // New field
        maxCapacityAh: number;
        type: string;
        voltage: number;
    };
    inverter?: {
        recommendedW: number;
        needed: boolean;
    } | null;
    booster?: {
        inputCurrentA: number;
        outputCurrentA: number;
        currentA: number;
        inputVoltage: number;
        outputVoltage: number;
        needsConversion: boolean;
    } | null;
    charger?: {
        recommendedCurrentA: number;
    } | null;
    solarController?: {
        recommendedCurrentA: number;
        type: 'MPPT' | 'PWM';
        needsSeparatePortableController: boolean;
    } | null;
    solarModules?: {
        requiredWp: number;
        recommendation: string;
    } | null;
    cables?: {
        route: string;
        displayName: string;
        recommendedCrossSection: number;
        currentA: number;
    }[];
}

export function formatSystemRequirementsForAI(requirements: SystemRequirementsForAI | null): string {
    if (!requirements) {
        return ''; // No pre-calculated requirements available
    }

    const sections: string[] = [];

    sections.push('## ⚠️ VORBERECHNETE SYSTEM-ANFORDERUNGEN (VERBINDLICH!)');
    sections.push('');
    sections.push('> **WICHTIG:** Die folgenden Werte wurden ALGORITHMISCH berechnet und sind VERBINDLICH.');
    sections.push('> **DU MUSST DIESE WERTE FÜR DIE PRODUKTAUSWAHL VERWENDEN!**');
    sections.push('> Führe KEINE eigenen Berechnungen durch, wähle nur passende Produkte aus.');
    sections.push('');

    // Daily consumption
    sections.push(`### Täglicher Verbrauch: **${requirements.dailyWh} Wh/Tag**`);
    sections.push('');

    // Battery
    sections.push('### Batterie');
    sections.push(`- **Minimale Kapazität (Schlechtwetter):** ${requirements.battery.minCapacityAh} Ah`);

    // Add recommended capacity visual
    if (requirements.battery.recommendedCapacityAh) {
        sections.push(`- **Empfohlene Kapazität (Optimal):** ${requirements.battery.recommendedCapacityAh} Ah`);
        sections.push(`- **Maximale Kapazität (Platzlimit):** ${requirements.battery.maxCapacityAh} Ah`);
        sections.push(`- **Typ:** ${requirements.battery.type.toUpperCase()}`);
        sections.push(`- **Systemspannung:** ${requirements.battery.voltage}V`);

        sections.push(`→ **ZIEL:** Wähle eine ${requirements.battery.type.toUpperCase()}-Batterie mit **${requirements.battery.recommendedCapacityAh}Ah**!`);
        sections.push(``);
        sections.push(`→ **🚨 KRITISCHE PRÄFERENZ - EINZELBATTERIE VORRANG 🚨**`);
        sections.push(`   **IMMER wenn verfügbar: Wähle EINE große Batterie statt mehrerer kleiner!**`);
        sections.push(`   ✅ RICHTIG: 1x 200Ah Batterie für ${requirements.battery.recommendedCapacityAh}Ah-Bedarf`);
        sections.push(`   ❌ FALSCH: 2x 100Ah Batterien (nur als NOTLÖSUNG wenn keine große verfügbar!)`);
        sections.push(``);
        sections.push(`→ **WARUM EINZELBATTERIE?**`);
        sections.push(`   - Weniger Verkabelung & Platz`);
        sections.push(`   - Geringere Fehleranfälligkeit`);
        sections.push(`   - Einfachere Installation`);
        sections.push(`   - Besseres Preis-Leistungs-Verhältnis`);
        sections.push(``);
        sections.push(`→ **AUSWAHLSTRATEGIE:**`);
        sections.push(`   1. ERSTE WAHL: Einzelbatterie mit ≥ ${requirements.battery.recommendedCapacityAh}Ah (z.B. 200Ah, 280Ah)`);
        sections.push(`   2. ZWEITE WAHL: Nächstgrößere Einzelbatterie (auch wenn 50-100% größer)`);
        sections.push(`   3. LETZTE WAHL: Mehrere Batterien NUR wenn absolut keine passende Einzelbatterie ≥ ${requirements.battery.minCapacityAh}Ah existiert`);
        sections.push(``);
        sections.push(`→ **WICHTIG:** Prüfe die Produktliste GRÜNDLICH nach großen Einzelbatterien bevor du mehrere empfiehlst!`);
    } else {
        // Fallback (legacy)
        sections.push(`- **Maximale Kapazität (Platz):** ${requirements.battery.maxCapacityAh} Ah`);
        sections.push(`- **Typ:** ${requirements.battery.type.toUpperCase()}`);
        sections.push(`- **Systemspannung:** ${requirements.battery.voltage}V`);
        sections.push(`→ Wähle eine ${requirements.battery.type.toUpperCase()}-Batterie mit mindestens ${requirements.battery.minCapacityAh}Ah!`);
        sections.push(`→ **FALLS keine Batterie ≥ ${requirements.battery.minCapacityAh}Ah verfügbar:** Empfehle MEHRERE kleinere Batterien in Parallelschaltung!`);
    }

    sections.push('');

    // Inverter
    if (requirements.inverter?.needed) {
        sections.push('### Wechselrichter');
        sections.push(`- **Benötigte Dauerleistung:** ${requirements.inverter.recommendedW}W`);
        sections.push(`→ Wähle einen Wechselrichter mit MINDESTENS ${requirements.inverter.recommendedW}W **DAUERLEISTUNG**!`);
        sections.push('→ **VERBOT:** Peak-Leistung ist NICHT relevant für resistive Lasten. Nur DAUERLEISTUNG zählt!');
        sections.push('');
    }

    // Booster
    if (requirements.booster) {
        sections.push('### Ladebooster (B2B)');
        sections.push(`- **Eingang (von Lichtmaschine):** ${requirements.booster.inputVoltage}V / ${Math.round(requirements.booster.inputCurrentA)}A`);
        sections.push(`- **Ausgang (zu Batterie):** ${requirements.booster.outputVoltage}V / ${Math.round(requirements.booster.outputCurrentA)}A`);
        if (requirements.booster.needsConversion) {
            sections.push(`→ **ACHTUNG:** Spannungswandlung erforderlich (${requirements.booster.inputVoltage}V → ${requirements.booster.outputVoltage}V)!`);
        }
        sections.push(`→ Wähle einen Ladebooster mit **${Math.round(requirements.booster.outputCurrentA)}A Ausgangsstrom** bei ${requirements.booster.inputVoltage}V→${requirements.booster.outputVoltage}V!`);
        sections.push(`→ **PRODUKTBEZEICHNUNG:** Achte auf die Output-Angabe, z.B. "Orion-Tr Smart ${requirements.booster.inputVoltage}/${requirements.booster.outputVoltage}-${Math.round(requirements.booster.outputCurrentA)}A"`);
        sections.push('');
    }

    // Charger
    if (requirements.charger) {
        sections.push('### Landstrom-Ladegerät');
        sections.push(`- **Empfohlener Ladestrom:** ${requirements.charger.recommendedCurrentA}A`);
        sections.push(`→ Wähle ein Ladegerät mit ${requirements.charger.recommendedCurrentA}A!`);
        sections.push('');
    }

    // Solar Controller
    if (requirements.solarController) {
        sections.push('### Solar-Laderegler');
        sections.push(`- **Empfohlener Strom:** ${requirements.solarController.recommendedCurrentA}A`);
        sections.push(`- **Typ:** ${requirements.solarController.type}`);
        if (requirements.solarController.needsSeparatePortableController) {
            sections.push('→ **HINWEIS:** Gemischtes Setup - ggf. separater Regler für Solartaschen empfehlen!');
        }
        sections.push(`→ Wähle einen ${requirements.solarController.type}-Regler mit mindestens ${requirements.solarController.recommendedCurrentA}A!`);
        sections.push('');
    }

    // Solar Modules
    if (requirements.solarModules) {
        sections.push('### Solarmodule');
        sections.push(`- **Benötigte Leistung:** ${requirements.solarModules.requiredWp}Wp`);
        sections.push(`- **Empfehlung:** ${requirements.solarModules.recommendation}`);
        sections.push('');
    }

    // Cables
    if (requirements.cables && requirements.cables.length > 0) {
        sections.push('### Kabel-Querschnitte (VERBINDLICH!)');
        requirements.cables.forEach(cable => {
            sections.push(`- **${cable.displayName}:** ${cable.recommendedCrossSection}mm² (für ${cable.currentA}A)`);
        });
        sections.push('→ Die Querschnitte sind bereits auf Standard-Größen aufgerundet. KEINE weitere Anpassung!');
        sections.push('');
    }

    sections.push('---');
    sections.push('');

    return sections.join('\n');
}

