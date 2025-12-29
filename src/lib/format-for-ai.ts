/**
 * Transforms wizard formData JSON into human-readable German text for AI prompts.
 * This ensures the AI understands context, units, and relationships.
 */

interface Consumer {
    id: string;
    category: string;
    name: string;
    power: number;
    voltage: string;
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

interface SolarBag {
    id: string;
    power: number;
}

interface CableLengths {
    starterToService: number;
    serviceToInverter: number;
    solarToRegulator: number;
    boiler?: number;
    waterPump?: number;
    batteryToFuseBox?: number;
    custom: Record<string, number>;
}

interface FormData {
    vehicleType: string | null;
    systemVoltage: string;
    energySources: string[];
    consumers: Consumer[];
    autarchyGoal: string;
    autarchyDays: number;
    solarSetupType: string;
    solarDimensions: SolarDimensions | null;
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
    lead_acid: 'Blei-Säure',
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
    sections.push(`Fahrzeugtyp: ${VEHICLE_TYPES[data.vehicleType || ''] || 'Nicht angegeben'}`);
    sections.push(`Systemspannung: ${data.systemVoltage}`);
    sections.push(`Batterietyp-Präferenz: ${BATTERY_TYPES[data.batteryPreference] || 'Keine Angabe'}`);
    if (data.batterySpaceSize) {
        sections.push(`Batterie-Einbauraum: ${BATTERY_SPACE_SIZES[data.batterySpaceSize] || data.batterySpaceSize}`);
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
        const totalWhPerDay = data.consumers.reduce((sum, c) => sum + (c.power * c.usageHoursPerDay), 0);

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

        if (data.solarDimensions) {
            const area = (data.solarDimensions.length * data.solarDimensions.width) / 10000;
            sections.push(`Verfügbare Dachfläche: ${data.solarDimensions.length}cm × ${data.solarDimensions.width}cm (${area.toFixed(2)}m²)`);
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
    sections.push(`Starterbatterie → Aufbaubatterie: ${data.cableLengths.starterToService} Meter`);

    const consumersRequire230V = data.consumers.some(c => c.voltage === '230V');
    if (consumersRequire230V) {
        sections.push(`Aufbaubatterie → Wechselrichter: ${data.cableLengths.serviceToInverter} Meter`);
    } else {
        // Explicitly note that no inverter cabling is needed to avoid confusion
        // sections.push(`(Kein Wechselrichter benötigt -> Keine Verkabelung angegeben)`);
    }

    if (data.energySources.includes('solar')) {
        sections.push(`Solarmodule → Laderegler: ${data.cableLengths.solarToRegulator} Meter`);
    }

    if (data.cableLengths.boiler) {
        sections.push(`Boiler-Anschluss: ${data.cableLengths.boiler} Meter`);
    }
    if (data.cableLengths.waterPump) {
        sections.push(`Wasserpumpe: ${data.cableLengths.waterPump} Meter`);
    }
    if (data.cableLengths.batteryToFuseBox) {
        sections.push(`Batterie → Sicherungskasten: ${data.cableLengths.batteryToFuseBox} Meter`);
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

    const has230V = data.consumers.some(c => c.voltage === '230V');
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
            mustHave.push('Faltbare Solartaschen (category: faltbare_solartaschen)');
            // Usually portable panels have integrated controllers, but if separate:
            if (type === 'portable') {
                mustHave.push('Solar-Laderegler (category: solar_controller)');
            }
        }
    }

    if (hasAlternator) mustHave.push('Ladebooster (category: ladebooster)');
    if (hasShorePower) mustHave.push('Ladegerät (category: charger)');

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
    const needsInverter = data.consumers.some(c => c.voltage === '230V');
    if (!needsInverter) {
        sections.push('- **WECHSELRICHTER-SPERRE:** Es sind KEINE 230V-Verbraucher gelistet -> Empfehle KEINEN Wechselrichter! (Auch nicht als "Nice-to-Have").');
    }

    if (!data.energySources.includes('solar')) {
        sections.push('- **SOLAR-SPERRE:** Kein Solar als Energiequelle gewählt -> Empfehle KEINE Laderegler und KEINE Module!');
    } else if (data.solarSetupType === 'mixed') {
        sections.push('- **SOLAR-LADEREGLER:** Bei "mixed" Setup (Dach + Mobil) empfehle bitte **ZWEI** Laderegler:');
        sections.push('  1. Einen für die Dachmodule (fest).');
        sections.push('  2. Einen für die faltbare Solartasche (mobil).');
        sections.push('  - Setze für BEIDE `isRecommended: true`.');
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

    // 3. Ladebooster Special Case (12V Alternator -> 24V System)
    if (data.systemVoltage === '24V' && data.energySources.includes('alternator')) {
        sections.push('\n**3. SONDERFALL LADEBOOSTER (WICHTIG):**');
        sections.push('- Ausgangssituation: Lichtmaschine ist 12V, Bordbatterie ist 24V.');
        sections.push('- **DU MUSST EINEN "12V AUF 24V" LADEBOOSTER WÄHLEN!**');
        sections.push('- Ein Standard "12V/12V" Booster ist UNGEEIGNET und DARF NICHT empfohlen werden.');
        sections.push('- Achte auf "Input: 12V" und "Output: 24V" in den Specs.');
    }

    if (data.systemVoltage === '24V' && data.consumers.some(c => c.voltage === '12V' || c.category === 'usb')) {
        sections.push('4. **DC-DC Wandler:** Da 12V/USB Verbraucher vorhanden sind, aber das System 24V hat, beachte dies bei der Konzept-Erstellung (ggf. Hinweis auf Wandler).');
    }

    return sections.join('\n');
}

/**
 * Compact version for shorter prompts (key facts only)
 */
export function formatFormDataCompact(data: FormData): string {
    const parts: string[] = [];

    parts.push(`Fahrzeug: ${VEHICLE_TYPES[data.vehicleType || ''] || 'Unbekannt'}, ${data.systemVoltage}`);
    parts.push(`Batterie: ${BATTERY_TYPES[data.batteryPreference] || 'Keine Präferenz'}`);
    parts.push(`Energiequellen: ${data.energySources.map(s => ENERGY_SOURCES[s] || s).join(', ') || 'Keine'}`);

    const totalWh = data.consumers.reduce((sum, c) => sum + (c.power * c.usageHoursPerDay), 0);
    parts.push(`Verbraucher: ${data.consumers.length} Geräte, ~${totalWh.toFixed(0)} Wh/Tag`);

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
