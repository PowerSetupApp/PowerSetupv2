/**
 * Product Preselection System
 * 
 * Zweistufiges System:
 * 1. Regelbasierte Vorauswahl mit Match-Scores basierend auf Algorithmus-Ergebnissen
 * 2. KI-Verfeinerung mit den vorausgewählten Produkten
 */

import { SystemRequirements, ProductWithFilter } from './adapter';

// =============================================================================
// TYPES
// =============================================================================

export interface PreselectedProduct {
    product: ProductWithFilter;
    matchScore: number;        // 0-100
    matchReason: string;       // Kurze Erklärung
    meetsMinimum: boolean;     // Erfüllt Mindestanforderung?
    quantity?: number;         // How many units are needed (for solar modules, batteries)
}

export interface CategoryRequirement {
    categorySlug: string;
    required: boolean;         // Wird diese Kategorie vom Algorithmus benötigt?
    minValue?: number;         // Minimal benötigter Wert
    targetValue?: number;      // Empfohlener Wert
    unit?: string;             // Einheit für Anzeige
    filterKey: string;         // Key im filterValues JSON
    additionalFilters?: Record<string, any>; // Zusätzliche Filter (z.B. Spannung)
    displayName?: string;      // Optionaler Display-Name für die UI (z.B. "Laderegler (Dach)")
}

export interface CategoryPreselection {
    categorySlug: string;
    categoryName: string;
    requiredByAlgorithm: boolean;
    requirement: CategoryRequirement | null;
    candidates: PreselectedProduct[];
}

export interface PreselectionResult {
    categories: CategoryPreselection[];
    totalProducts: number;
    selectedProducts: number;
    minScoreThreshold: number;
}

// =============================================================================
// CATEGORY REQUIREMENT MAPPING
// =============================================================================

/**
 * Generiert die Kategorie-Anforderungen basierend auf den SystemRequirements
 */
export function getCategoryRequirements(
    requirements: SystemRequirements,
    formData: any
): CategoryRequirement[] {
    const reqs: CategoryRequirement[] = [];

    // Batterien - berücksichtige Nutzer-Override wenn vorhanden
    const userBatteryCapacity = formData?.customBatteryCapacity;
    const calculatedMinCapacity = requirements.battery.minCapacityAh;
    const calculatedRecommended = requirements.battery.recommendedCapacityAh;

    // Wenn Nutzer eine höhere Kapazität wünscht, verwende diese als Minimum
    const effectiveMinCapacity = userBatteryCapacity && userBatteryCapacity > calculatedMinCapacity
        ? userBatteryCapacity
        : calculatedMinCapacity;
    const effectiveTargetCapacity = userBatteryCapacity && userBatteryCapacity > calculatedRecommended
        ? userBatteryCapacity
        : calculatedRecommended;

    reqs.push({
        categorySlug: 'batterien',
        required: true,
        minValue: effectiveMinCapacity,
        targetValue: effectiveTargetCapacity,
        unit: 'Ah',
        filterKey: 'capacityAh',
        additionalFilters: {
            voltageV: requirements.systemVoltage,
            batteryType: requirements.batteryType !== 'any' ? requirements.batteryType : undefined,
        }
    });

    // Wechselrichter (nur wenn 230V Verbraucher)
    if (requirements.inverter?.needed) {
        reqs.push({
            categorySlug: 'wechselrichter',
            required: true,
            minValue: requirements.inverter.requiredW,
            targetValue: requirements.inverter.recommendedW,
            unit: 'W',
            filterKey: 'outputPowerW',
            additionalFilters: {
                inputVoltage: requirements.systemVoltage,
            }
        });
    }

    // Ladebooster (nur wenn Lichtmaschine gewählt)
    if (requirements.booster?.needed) {
        reqs.push({
            categorySlug: 'ladebooster',
            required: true,
            minValue: Math.round(requirements.booster.outputCurrentA * 0.8), // 80% als Minimum
            targetValue: Math.round(requirements.booster.outputCurrentA),
            unit: 'A',
            filterKey: 'maxChargeCurrent',
            additionalFilters: {
                inputVoltage: requirements.vehicleVoltage,
                outputVoltage: requirements.systemVoltage,
            }
        });
    }

    // Batterieladegerät (nur wenn Landstrom gewählt)
    if (requirements.charger?.needed) {
        reqs.push({
            categorySlug: 'batterieladegeraete',
            required: true,
            minValue: Math.round(requirements.charger.targetCurrentA * 0.8),
            targetValue: requirements.charger.recommendedCurrentA,
            unit: 'A',
            filterKey: 'maxChargeA',
            additionalFilters: {
                outputVoltage: requirements.systemVoltage,
            }
        });
    }

    // Solar-Laderegler (Unterscheidung nach Setup-Typ)
    if (requirements.solarController?.needed) {
        const solarSetup = formData?.solarSetupType || 'roof';
        const sysVoltage = requirements.systemVoltage || 12;

        if (solarSetup === 'mixed') {
            // MIXED: Zwei separate Laderegler
            // 1. Dach
            if (requirements.solarModules?.maxRoofWp && requirements.solarModules.maxRoofWp > 0) {
                const roofCurrent = Math.ceil(requirements.solarModules.maxRoofWp / sysVoltage);
                const roofTarget = Math.ceil(roofCurrent * 1.2); // 20% Puffer

                reqs.push({
                    categorySlug: 'solar-laderegler',
                    displayName: 'Solar-Laderegler (Dach)',
                    required: true,
                    minValue: roofCurrent,
                    targetValue: roofTarget,
                    unit: 'A',
                    filterKey: 'maxAmpere',
                    additionalFilters: {
                        inputVoltage: sysVoltage,
                    }
                });
            }

            // 2. Mobil
            if (requirements.solarModules?.portableWp && requirements.solarModules.portableWp > 0) {
                const portableCurrent = Math.ceil(requirements.solarModules.portableWp / sysVoltage);
                const portableTarget = Math.ceil(portableCurrent * 1.2);

                reqs.push({
                    categorySlug: 'solar-laderegler',
                    displayName: 'Solar-Laderegler (Mobil)',
                    required: true,
                    minValue: portableCurrent,
                    targetValue: portableTarget,
                    unit: 'A',
                    filterKey: 'maxAmpere',
                    additionalFilters: {
                        inputVoltage: sysVoltage,
                    }
                });
            }
        } else {
            // ROOF OR PORTABLE only: Ein Laderegler für die jeweilige Quelle
            // Berechne den Strom nur für die relevante Solar-Quelle (nicht totalWp!)
            const solarSetup = formData?.solarSetupType || 'roof';
            const sysVoltage = requirements.systemVoltage || 12;

            let relevantWp = 0;
            if (solarSetup === 'roof') {
                // Nur Dach-Solar
                relevantWp = requirements.solarModules?.maxRoofWp || 0;
            } else if (solarSetup === 'portable') {
                // Nur Portable
                relevantWp = requirements.solarModules?.portableWp || 0;
            }

            const calculatedCurrent = Math.ceil(relevantWp / sysVoltage);
            const targetCurrent = Math.ceil(calculatedCurrent * 1.2); // 20% Puffer

            reqs.push({
                categorySlug: 'solar-laderegler',
                required: true,
                minValue: calculatedCurrent,
                targetValue: targetCurrent,
                unit: 'A',
                filterKey: 'maxAmpere',
                additionalFilters: {
                    inputVoltage: requirements.systemVoltage,
                }
            });
        }
    }

    // Solarmodule (nur wenn Solar gewählt und Dachfläche vorhanden)
    if (requirements.solarModules?.needed && requirements.solarModules.maxRoofWp > 0) {
        reqs.push({
            categorySlug: 'solarmodule',
            required: true,
            minValue: 50, // Mindestens 50Wp pro Modul
            targetValue: requirements.solarModules.requiredWp,
            unit: 'Wp',
            filterKey: 'maxPowerWp',
            additionalFilters: {
                // constructionType aus formData
                constructionType: formData?.roofModuleType === 'flexible' ? 'Flexibel' : 'Starr',
                // Use roofAreas first (new format), fallback to solarDimensions (legacy)
                maxDimensions: (formData?.roofAreas && formData.roofAreas.length > 0)
                    ? { length: formData.roofAreas[0].length, width: formData.roofAreas[0].width }
                    : formData?.solarDimensions || undefined,
            }
        });
    }

    // Solartaschen (wenn vorhanden)
    if (formData?.solarBags?.length > 0) {
        const totalBagPower = formData.solarBags.reduce((sum: number, bag: any) => sum + (bag.power || 0), 0);
        if (totalBagPower > 0) {
            reqs.push({
                categorySlug: 'solartaschen',
                required: true,
                minValue: 50,
                targetValue: totalBagPower,
                unit: 'Wp',
                filterKey: 'maxPowerWp',
            });
        }
    }

    // Kabel (für jede benötigte Route)
    if (requirements.cables && requirements.cables.length > 0) {
        // Gruppiere nach Querschnitt und nimm den größten
        const maxCrossSection = Math.max(...requirements.cables.map(c => c.recommendedCrossSection));
        reqs.push({
            categorySlug: 'kabel',
            required: true,
            minValue: maxCrossSection,
            targetValue: maxCrossSection,
            unit: 'mm²',
            filterKey: 'crossSectionMm2',
        });
    }

    return reqs;
}

// =============================================================================
// MATCH SCORE CALCULATION
// =============================================================================

/**
 * Berechnet den Match-Score für ein Produkt basierend auf der Kategorie-Anforderung
 */
function calculateMatchScore(
    product: ProductWithFilter,
    requirement: CategoryRequirement,
    brandPreferences?: Record<string, string | null>
): { score: number; reason: string; meetsMinimum: boolean; quantity?: number } {
    let score = 0;
    const reasons: string[] = [];
    let meetsMinimum = true;

    // Parse filterValues aus Produkt
    let filterValues: Record<string, any> = {};
    if (product.specs) {
        try {
            filterValues = typeof product.specs === 'string'
                ? JSON.parse(product.specs)
                : product.specs;
        } catch { }
    }

    // Hole Hauptwert aus filterValues oder direktem Feld
    const mainValue = getProductValue(product, filterValues, requirement.filterKey);

    if (mainValue === null || mainValue === undefined) {
        // Kein Wert vorhanden - niedrigster Score
        return { score: 10, reason: 'Keine technischen Daten verfügbar', meetsMinimum: false };
    }

    // 1. Erfüllt Mindestanforderung? (+50 Punkte)
    // Add 2% tolerance for rounding errors
    if (requirement.minValue !== undefined && typeof mainValue === 'number') {
        const tolerance = requirement.minValue * 0.98;
        if (mainValue >= tolerance) {
            score += 50;
            reasons.push(`Erfüllt Minimum (${mainValue}${requirement.unit || ''} ≥ ${requirement.minValue}${requirement.unit || ''})`);
        } else {
            meetsMinimum = false;
            // Prozentualer Abzug basierend auf Unterschreitung
            const ratio = mainValue / requirement.minValue;
            score += Math.round(50 * ratio);
            reasons.push(`Unter Minimum (${mainValue}${requirement.unit || ''} < ${requirement.minValue}${requirement.unit || ''})`);
        }
    } else if (requirement.minValue === undefined) {
        score += 50; // Kein Minimum definiert
    }

    // 2. Wie nah am Zielwert? (+30 Punkte max)
    if (requirement.targetValue !== undefined && mainValue !== null && typeof mainValue === 'number') {
        const ratio = mainValue / requirement.targetValue;
        if (ratio >= 1.0 && ratio <= 1.3) {
            // Perfekt bis 30% über Ziel = volle Punkte
            score += 30;
            reasons.push('Optimal für Anforderung');
        } else if (ratio > 1.3 && ratio <= 2.0) {
            // 30-100% überdimensioniert = weniger Punkte (Overkill)
            score += Math.round(30 * (1 - (ratio - 1.3) / 0.7));
            reasons.push('Leicht überdimensioniert');
        } else if (ratio > 2.0) {
            // Stark überdimensioniert
            score += 10;
            reasons.push('Stark überdimensioniert');
        } else {
            // Unter Ziel
            score += Math.round(30 * ratio);
        }
    }

    // 3. Spannungs-Kompatibilität prüfen (disqualifizierend wenn nicht passend)
    if (requirement.additionalFilters) {
        let skipNormalVoltageCheck = false;

        // SPECIAL CASE: Ladebooster - prüfe Input UND Output separat
        if (requirement.categorySlug === 'ladebooster') {
            const expectedInputV = requirement.additionalFilters['inputVoltage'];
            const expectedOutputV = requirement.additionalFilters['outputVoltage'];

            if (expectedInputV !== undefined && expectedOutputV !== undefined) {
                // Hole spezifische Input/Output Spannungen aus filterValues
                const productInputV = getProductValue(product, filterValues, 'inputVoltage');
                const productOutputV = getProductValue(product, filterValues, 'outputVoltage');

                // Prüfe Input-Spannung
                const inputCompatible = checkVoltageCompatibility(productInputV, expectedInputV);
                if (!inputCompatible) {
                    return {
                        score: 0,
                        reason: `Input-Spannung nicht kompatibel (erwartet: ${expectedInputV}V, Produkt: ${productInputV})`,
                        meetsMinimum: false
                    };
                }

                // Prüfe Output-Spannung
                const outputCompatible = checkVoltageCompatibility(productOutputV, expectedOutputV);
                if (!outputCompatible) {
                    return {
                        score: 0,
                        reason: `Output-Spannung nicht kompatibel (erwartet: ${expectedOutputV}V, Produkt: ${productOutputV})`,
                        meetsMinimum: false
                    };
                }

                // Wenn wir hier sind, sind beide Spannungen kompatibel
                // Überspringe die normalen Voltage-Checks unten
                skipNormalVoltageCheck = true;
            }
        }

        // NORMAL CASE: Andere Kategorien
        for (const [filterKey, expectedValue] of Object.entries(requirement.additionalFilters)) {
            if (expectedValue === undefined) continue;

            const productValue = getProductValue(product, filterValues, filterKey);

            // Spannungs-Check (unterstützt Arrays und Strings wie "12V")
            // Aber nur wenn wir nicht bereits den Ladebooster-spezifischen Check gemacht haben
            if (filterKey.toLowerCase().includes('voltage') && !skipNormalVoltageCheck) {
                const isCompatible = checkVoltageCompatibility(productValue, expectedValue);
                if (!isCompatible) {
                    return { score: 0, reason: `Spannung nicht kompatibel (erwartet: ${expectedValue}V)`, meetsMinimum: false };
                }
            }

            // Batterie-Typ Check
            if (filterKey === 'batteryType' && productValue) {
                const productType = String(productValue).toLowerCase();
                const expectedType = String(expectedValue).toLowerCase();
                if (productType !== expectedType && expectedType !== 'any') {
                    return { score: 0, reason: `Batterie-Typ nicht kompatibel (${productType} ≠ ${expectedType})`, meetsMinimum: false };
                }
            }
        }
    }

    // 3b. Dimension Check für Solarmodule (STRIKTER Ausschluss)
    if (requirement.additionalFilters?.maxDimensions && requirement.categorySlug === 'solarmodule') {
        const productDims = getProductDimensions(product);
        const maxDims = requirement.additionalFilters.maxDimensions; // { length, width }

        if (productDims) {
            // 1. Physischer Fit Check (inkl. Rotation)
            // Passt das Modul Längs ODER Quer in die definierte Fläche?
            // Wir checken hier erst mal, ob EIN Modul überhaupt auf das Dach passt.
            // Wenn das Modul größer als das *gesamte* Dach ist, fliegt es raus.

            // Check 1: Standard-Orientierung
            // Toleranz von 1cm für Rundungsfehler
            const tolerance = 1.0;
            const fitsStandard = (productDims.length <= maxDims.length + tolerance && productDims.width <= maxDims.width + tolerance);

            // Check 2: Rotierte Orientierung
            const fitsRotated = (productDims.length <= maxDims.width + tolerance && productDims.width <= maxDims.length + tolerance);

            if (!fitsStandard && !fitsRotated) {
                // Modul passt physisch NICHT auf das Dach (in keiner Orientierung)
                return {
                    score: 0,
                    reason: `Modul zu groß (${productDims.length}x${productDims.width}mm) für Dachfläche (${maxDims.length}x${maxDims.width}mm)`,
                    meetsMinimum: false
                };
            }
        }
        // Hinweis: Wenn keine Dimensionen im Produkt hinterlegt sind, lassen wir es durch (im Zweifel für den Angeklagten),
        // aber geben keine Extra-Punkte.
    }

    // 4. Marken-Präferenz (+20 Punkte wenn bevorzugte Marke, -0 wenn keine Präferenz)
    if (brandPreferences && product.category?.slug) {
        const preferredBrand = getBrandPreferenceForCategory(product.category.slug, brandPreferences);
        if (preferredBrand) {
            const productBrand = (product.brandName || product.name || '').toLowerCase();
            const preferred = preferredBrand.toLowerCase();
            if (productBrand.includes(preferred) || preferred.includes(productBrand.split(' ')[0])) {
                score += 20;
                reasons.push(`Bevorzugte Marke (${preferredBrand})`);
            }
        }
    }

    // SPECIAL: Solar Module Logic - Calculate Quantity
    let calculatedQuantity: number | undefined = undefined;
    if (requirement.categorySlug === 'solarmodule' && requirement.targetValue && typeof mainValue === 'number') {
        const count = Math.ceil(requirement.targetValue / mainValue);
        calculatedQuantity = count;
        if (count > 1) {
            reasons.push(`Benötigt ca. ${count}x für Zielerreichung`);
        }
    }

    // SPECIAL: Battery Quantity Calculation
    if (requirement.categorySlug === 'batterien' && (requirement.minValue || requirement.targetValue) && typeof mainValue === 'number') {
        const required = requirement.targetValue || requirement.minValue || 100;
        const count = Math.ceil(required / mainValue);
        calculatedQuantity = count;
        if (count > 1) {
            reasons.push(`Benötigt ${count}x für Zielkapazität (Parallelschaltung)`);
            // STRONG penalty for multi-battery setup - we want to avoid this!
            score -= 20;
        } else {
            reasons.push(`Einzel-Batterie ausreichend - optimal!`);
            // STRONG bonus for single-battery setup - this is what we want!
            score += 30;
        }
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        reason: reasons.join('. '),
        meetsMinimum,
        quantity: calculatedQuantity
    };
}

/**
 * Hilfsfunktion um einen Wert aus Produkt oder filterValues zu holen
 */
function getProductValue(
    product: ProductWithFilter,
    filterValues: Record<string, any>,
    key: string
): number | string | number[] | null {
    // Mapping von filterKey zu Produkt-Feld
    const fieldMapping: Record<string, keyof ProductWithFilter> = {
        'capacityAh': 'capacityAh',
        'voltageV': 'voltageV',
        'outputPowerW': 'powerW',
        'powerW': 'powerW',
        'maxChargeCurrent': 'currentA',
        'maxChargeA': 'currentA',
        'currentA': 'currentA',
        'maxAmpere': 'currentA',
        'maxPowerWp': 'solarWp',
        'crossSectionMm2': 'crossSectionMm2',
        'batteryType': 'batteryType',
    };

    // SPECIAL: Für Ladebooster - inputVoltage/outputVoltage kommen aus filterValues.inputVolts/outputVolts
    if (key === 'inputVoltage' && filterValues['inputVolts']) {
        // inputVolts ist ein Array [12] oder [24] oder [12, 24]
        // Wir nehmen den ersten Wert wenn es nur einer ist, oder den Array wenn mehrere
        const inputVolts = filterValues['inputVolts'];
        if (Array.isArray(inputVolts)) {
            return inputVolts.length === 1 ? inputVolts[0] : inputVolts;
        }
        return inputVolts;
    }

    if (key === 'outputVoltage' && filterValues['outputVolts']) {
        const outputVolts = filterValues['outputVolts'];
        if (Array.isArray(outputVolts)) {
            return outputVolts.length === 1 ? outputVolts[0] : outputVolts;
        }
        return outputVolts;
    }

    // Erst im Produkt-Feld suchen
    const productField = fieldMapping[key];
    if (productField && product[productField] !== undefined && product[productField] !== null) {
        return product[productField] as any;
    }

    // Dann in filterValues suchen
    if (filterValues[key] !== undefined) {
        return filterValues[key];
    }

    // Fallback für Spannungen: Versuche supportedVoltages
    if (key === 'inputVoltage' || key === 'outputVoltage') {
        if (product.supportedVoltages !== undefined && product.supportedVoltages !== null) {
            return product.supportedVoltages as any;
        }
    }

    return null;
}

/**
 * Prüft Spannungskompatibilität (unterstützt Arrays, Strings, Zahlen)
 */
function checkVoltageCompatibility(productValue: any, expectedVoltage: number): boolean {
    if (!productValue) return true; // Keine Angabe = wir nehmen an es passt

    // Array von Spannungen (z.B. [12, 24])
    if (Array.isArray(productValue)) {
        return productValue.includes(expectedVoltage);
    }

    // String wie "12V" oder "12V, 24V"
    if (typeof productValue === 'string') {
        const voltages = productValue.match(/\d+/g);
        if (voltages) {
            return voltages.map(v => parseInt(v)).includes(expectedVoltage);
        }
    }

    // Zahl
    if (typeof productValue === 'number') {
        return productValue === expectedVoltage;
    }

    return true;
}

/**
 * Mappt Kategorie-Slug zu Brand-Preference-Key
 */
function getBrandPreferenceForCategory(
    categorySlug: string,
    brandPreferences: Record<string, string | null>
): string | null {
    const mapping: Record<string, string> = {
        'batterien': 'battery',
        'solarmodule': 'solar',
        'solartaschen': 'solar',
        'solar-laderegler': 'charger',
        'ladebooster': 'charger',
        'batterieladegeraete': 'charger',
        'wechselrichter': 'charger',
    };

    const prefKey = mapping[categorySlug];
    return prefKey ? brandPreferences[prefKey] || null : null;
}

// =============================================================================
// MAIN PRESELECTION FUNCTION
// =============================================================================

/**
 * Führt die regelbasierte Produktvorauswahl durch
 */
export function preselectProducts(
    products: ProductWithFilter[],
    requirements: SystemRequirements,
    formData: any,
    minScoreThreshold: number = 30,
    brandPreferences?: Record<string, string | null>
): PreselectionResult {
    // 1. Generiere Kategorie-Anforderungen
    const categoryReqs = getCategoryRequirements(requirements, formData);

    // 2. Gruppiere Produkte nach Kategorie
    const productsByCategory = new Map<string, ProductWithFilter[]>();
    for (const product of products) {
        const slug = product.category?.slug;
        if (slug) {
            if (!productsByCategory.has(slug)) {
                productsByCategory.set(slug, []);
            }
            productsByCategory.get(slug)!.push(product);
        }
    }

    // 3. Für jede Kategorie: Berechne Scores und filtere
    const categories: CategoryPreselection[] = [];
    let totalSelected = 0;

    for (const req of categoryReqs) {
        const categoryProducts = productsByCategory.get(req.categorySlug) || [];
        const candidates: PreselectedProduct[] = [];
        const allCandidatesForFallback: PreselectedProduct[] = []; // Für Batterie-Fallback

        for (const product of categoryProducts) {
            const { score, reason, meetsMinimum, quantity } = calculateMatchScore(
                product,
                req,
                brandPreferences
            );

            // Speichere alle Kandidaten für möglichen Batterie-Fallback
            if (req.categorySlug === 'batterien' && score > 0) {
                allCandidatesForFallback.push({
                    product,
                    matchScore: score,
                    matchReason: reason,
                    meetsMinimum,
                    quantity
                });
            }

            // Nur Produkte über der Schwelle aufnehmen
            if (score >= minScoreThreshold) {
                candidates.push({
                    product,
                    matchScore: score,
                    matchReason: reason,
                    meetsMinimum,
                    quantity
                });
            }
        }

        // Spezialfall BATTERIEN: Wenn keine Batterie das Minimum erfüllt, 
        // füge die größten verfügbaren hinzu (für Parallelschaltung)
        if (req.categorySlug === 'batterien' && candidates.filter(c => c.meetsMinimum).length === 0) {
            // Sortiere nach Kapazität (descending) um die größten zu finden
            const sortedByCapacity = allCandidatesForFallback
                .filter(c => c.product.capacityAh && c.product.capacityAh > 0)
                .sort((a, b) => (b.product.capacityAh || 0) - (a.product.capacityAh || 0));

            // Füge die Top 3 größten Batterien hinzu (falls nicht bereits vorhanden)
            for (const fallbackCandidate of sortedByCapacity.slice(0, 3)) {
                const exists = candidates.some(c => c.product.id === fallbackCandidate.product.id);
                if (!exists) {
                    // Modifiziere den Grund um Parallelschaltung zu erwähnen
                    const requiredCapacity = req.minValue || req.targetValue || 0;
                    const batteryCapacity = fallbackCandidate.product.capacityAh || 0;
                    const unitsNeeded = Math.ceil(requiredCapacity / batteryCapacity);

                    candidates.push({
                        ...fallbackCandidate,
                        matchReason: `Größte verfügbare Batterie. Für ${requiredCapacity}Ah werden ${unitsNeeded}x ${batteryCapacity}Ah benötigt (Parallelschaltung).`,
                        meetsMinimum: false
                    });
                }
            }
        }

        // Spezialfall BATTERIEN: Bevorzuge EINE große Batterie vor mehreren kleinen
        if (req.categorySlug === 'batterien') {
            candidates.sort((a, b) => {
                // 1. Priorität: Kann den Bedarf ALLEINE decken? (meetsMinimum)
                if (a.meetsMinimum && !b.meetsMinimum) return -1;
                if (!a.meetsMinimum && b.meetsMinimum) return 1;

                // 2. Priorität: WENN beide NICHT das Minimum erfüllen (Fallback), nimm IMMER die größere!
                // Denn: 100Ah ist schlimmer als 150Ah wenn wir 200Ah brauchen.
                if (!a.meetsMinimum && !b.meetsMinimum) {
                    const capA = getProductValue(a.product, {}, 'capacityAh') as number || 0;
                    const capB = getProductValue(b.product, {}, 'capacityAh') as number || 0;
                    return capB - capA; // Größere Kapazität gewinnt
                }

                // 3. Priorität: Wenn beide erfüllen, nimm die mit Score (näher am Target etc.)
                // Aber: Wenn der Score sehr nah beisammen ist, nimm lieber die größere Kapazität (SicherheitsPuffer)
                if (Math.abs(a.matchScore - b.matchScore) > 10) {
                    return b.matchScore - a.matchScore;
                }

                // 4. Fallback: Score ähnlich -> nimm die Größere
                const capA = getProductValue(a.product, {}, 'capacityAh') as number || 0;
                const capB = getProductValue(b.product, {}, 'capacityAh') as number || 0;
                return capB - capA;
            });
        }

        // Spezialfall SOLARMODULE: Sortiere nach Wp (Power), wenn Scores ähnlich sind
        if (req.categorySlug === 'solarmodule') {
            candidates.sort((a, b) => {
                const scoreDiff = Math.abs(a.matchScore - b.matchScore);
                // Wenn Scores innerhalb von 10 Punkten liegen -> Bevorzuge mehr Power
                if (scoreDiff <= 10) {
                    const wpA = getProductValue(a.product, {}, 'maxPowerWp') as number || 0;
                    const wpB = getProductValue(b.product, {}, 'maxPowerWp') as number || 0;
                    return wpB - wpA; // Höhere Power zuerst
                }
                return b.matchScore - a.matchScore; // Sonst nach Score
            });
        } else {
            // Sortiere nach Score absteigend (Standard)
            candidates.sort((a, b) => b.matchScore - a.matchScore);
        }

        const categoryName = req.displayName || getCategoryDisplayName(req.categorySlug);

        categories.push({
            categorySlug: req.categorySlug,
            categoryName,
            requiredByAlgorithm: req.required,
            requirement: req,
            candidates
        });

        totalSelected += candidates.length;
    }

    return {
        categories,
        totalProducts: products.length,
        selectedProducts: totalSelected,
        minScoreThreshold
    };
}

/**
 * Gibt den Anzeigenamen für eine Kategorie zurück
 */
function getCategoryDisplayName(slug: string): string {
    const names: Record<string, string> = {
        'batterien': 'Batterien',
        'wechselrichter': 'Wechselrichter',
        'ladebooster': 'Ladebooster',
        'batterieladegeraete': 'Batterieladegeräte',
        'solar-laderegler': 'Solar-Laderegler',
        'solarmodule': 'Solarmodule',
        'solartaschen': 'Solartaschen',
        'kabel': 'Kabel',
        'sicherungen': 'Sicherungen',
        'sicherungskaesten': 'Sicherungskästen',
    };
    return names[slug] || slug;
}

// =============================================================================
// FORMAT FOR AI
// =============================================================================

/**
 * Produkt-Dimensionen aus FilterValues holen (Hilfsfunktion)
 */
function getProductDimensions(product: ProductWithFilter): { length: number, width: number } | null {
    let l: any = null;
    let w: any = null;

    // 1. Check in filterValues (DB Column)
    if ((product as any).filterValues) {
        const fv = (product as any).filterValues;
        l = fv['dimensions_length'];
        w = fv['dimensions_width'];
    }

    // 2. Fallback: Check in specs (Legacy/Markdown-JSON) if not found yet
    if (l === undefined || w === undefined || l === null || w === null) {
        let filterValues: Record<string, any> = {};
        if (product.specs) {
            try {
                filterValues = typeof product.specs === 'string'
                    ? JSON.parse(product.specs)
                    : product.specs;
                l = filterValues['dimensions_length'];
                w = filterValues['dimensions_width'];
            } catch { }
        }
    }

    if (typeof l === 'number' && typeof w === 'number') {
        // Normalization:
        // Solarmodule für Camper sind selten > 400cm lang.
        // Wenn Wert > 400, gehen wir von Millimetern aus und rechnen in cm um.
        const finalL = l > 400 ? l / 10 : l;
        const finalW = w > 400 ? w / 10 : w;
        return { length: finalL, width: finalW };
    }
    return null;
}

/**
 * Formatiert die Vorauswahl für den KI-Prompt
 */
export function formatPreselectionForAI(
    preselection: PreselectionResult
): string {
    const lines: string[] = [
        '## Vorausgewählte Produkte',
        '',
        `Die folgenden ${preselection.selectedProducts} Produkte wurden basierend auf den berechneten Anforderungen vorausgewählt.`,
        `Match-Score-Schwelle: ${preselection.minScoreThreshold}/100`,
        '',
        '**WICHTIG:** Wähle bevorzugt Produkte mit hohem Match-Score. Berücksichtige aber auch Preis-Leistung.',
        ''
    ];

    for (const category of preselection.categories) {
        if (category.candidates.length === 0) continue;

        const req = category.requirement;
        let header = `### ${category.categoryName}`;
        if (req?.targetValue && req?.unit) {
            header += ` (Empfohlen: ${req.targetValue}${req.unit})`;
        }
        lines.push(header);
        lines.push('');

        // Tabelle
        lines.push('| ID | Name | Wert | Preis | Score |');
        lines.push('|---|---|---|---|---|');

        for (const candidate of category.candidates.slice(0, 10)) { // Max 10 pro Kategorie
            const { product, matchScore } = candidate;
            const value = req ? getProductValue(product, {}, req.filterKey) : '-';
            const valueStr = value !== null ? `${value}${req?.unit || ''}` : '-';
            const priceStr = product.price ? `${product.price}€` : '-';

            lines.push(`| ${product.id} | ${product.name.substring(0, 40)} | ${valueStr} | ${priceStr} | ${matchScore} |`);
        }

        lines.push('');
    }

    return lines.join('\n');
}

