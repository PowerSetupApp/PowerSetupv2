/**
 * CAMPER ELECTRICAL ALGORITHM v7.0 - COMPLETE REDESIGN
 * 
 * Mathematisches Modell zur korrekten Dimensionierung von Wohnmobil-Elektrik.
 * 
 * ÄNDERUNGEN:
 * - Solar-Rückrechnung: "Wie viel Wp brauche ich?" statt nur maxRoofWp
 * - Batterie basierend auf Schlechtwetter-Defizit × Backup-Tage
 * - Kalibriert mit Real-Life Daten (1000Wp → 620Wh bei Schlechtwetter)
 */

// =============================================================================
// KONFIGURATION
// =============================================================================

const CONFIG = {
    // Batterie-Parameter
    BATTERY: {
        DOD: { lifepo4: 0.90, agm: 0.50, gel: 0.50 },
        SAFETY_BUFFER: 1.30,
        MIN_CAPACITY: { v12: 100, v24: 100, v48: 50 },
        // Max Ah pro Space-Setting
        SPACE_LIMITS: { compact: 150, medium: 280, spacious: 500 }
    },

    // Peak Sun Hours (PSH) - Volllaststunden pro Tag
    PSH: {
        summer_only: {
            germany_alps: 5.0,
            southern_europe: 6.5,
            scandinavia: 5.8,
            central_europe: 5.2,
            varies: 4.5
        },
        all_year: {
            germany_alps: 2.8,
            southern_europe: 4.3,
            scandinavia: 3.1,
            central_europe: 3.0,
            varies: 2.5
        },
        winter_focused: {
            germany_alps: 0.6,
            southern_europe: 2.2,
            scandinavia: 0.4,
            central_europe: 0.8,
            varies: 0.4
        }
    } as Record<string, Record<string, number>>,

    // Solar-Faktoren
    SOLAR: {
        // Wp pro m² Dachfläche
        WP_PER_M2: 200,
        // Nutzbare Dachfläche (Luken, Lüfter abziehen)
        ROOF_UTILIZATION: 0.75,
        // Tetris-Verschnitt (Module passen nie perfekt)
        TETRIS_FACTOR: 0.80,
        // Orientierungsverlust
        ORIENTATION: {
            roof: 0.85,      // Flache Montage = -15%
            portable: 1.00   // Ausrichtbar = 0% Verlust
        },
        // Systemverluste (MPPT, Kabel, Verschmutzung)
        SYSTEM_LOSS: 0.85,
        // Modultyp-Effizienz
        MODULE_TYPE: {
            rigid: 1.00,     // Rahmenmodule (hinterlüftet)
            flexible: 0.90   // Flexible (Wärmestau)
        },
        // Schlechtwetter-Faktor (kalibriert: 620Wh aus 1000Wp ≈ 0.40)
        CLOUDY_FACTOR: 0.35,
        // Max. Solartaschen-Leistung (Handhabbarkeit)
        MAX_PORTABLE_WP: 400,
        // Safety-Buffer für empfohlene Wp
        RECOMMENDED_BUFFER: 1.20
    },

    // Ladebooster-Leistung nach Lichtmaschinen-Typ
    BOOSTER: {
        standard: 30,
        enhanced: 50,
        euro6d_smart: 30,
        unknown: 20
    } as Record<string, number>,

    // Fahrzeiten pro Tag basierend auf Standzeit
    DRIVE_HOURS: {
        short: 2.5,    // Wenig Stehen → viel Fahrt
        medium: 0.8,   // Normal
        long: 0.2      // Viel Stehen → wenig Fahrt
    } as Record<string, number>,

    // Backup-Tage für Batterie-Sizing (Schlechtwetter-Überbrückung)
    BACKUP_DAYS: {
        weekend: 1,
        week: 2,
        extended: 4,
        permanent: 7
    } as Record<string, number>,

    // Wechselrichter
    INVERTER: {
        EFFICIENCY: 0.85,
        SIM_FACTORS: { low: 0.3, moderate: 0.5, high: 0.7 },
        CLASSES: [500, 800, 1200, 1600, 2000, 3000, 5000]
    },

    // Ladegeräte (Landstrom)
    CHARGER: {
        TARGET_HOURS: { slow: 14, normal: 8, fast: 4 },
        CLASSES: [10, 15, 20, 25, 30, 40, 50, 60]
    },

    // Kabelphysik
    CABLES: {
        RHO_COPPER: 0.0178,
        DROP_CRITICAL: 0.02,
        DROP_STANDARD: 0.03,
        CROSS_SECTIONS: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]
    }
};

// =============================================================================
// TEST-EINGABEN (Nutzer-Szenario)
// =============================================================================

const USER_INPUT = {
    // System-Grundlagen
    systemVoltage: 24,
    vehicleVoltage: 12,
    batteryPreference: "lifepo4" as const,
    batterySpaceSize: "medium" as const,

    // Energiequellen
    energySources: ["solar", "alternator", "shore_power"] as const,
    alternatorSize: "enhanced" as const,
    shoreChargingSpeed: "normal" as const,

    // Solar-Konfiguration
    roofModuleType: "rigid" as const,
    // Nutzer-Daten: ca. 5m² netto für ~1000Wp
    roofAreas: [{ length: 500, width: 100 }], // 5m² → 1000Wp (200Wp/m² × 0.75 × 0.8 × 5 = 600Wp... aber Nutzer hat 1000Wp)
    solarBags: [] as { power: number }[],     // Vorhandene Solartaschen

    // Reiseverhalten
    season: "winter_focused" as const,
    winterLocation: "southern_europe" as const,
    standingDuration: "long" as const,        // Wenig Fahrt
    tripDuration: "permanent" as const,
    autarchyDays: 7,

    // Verbraucher
    simultaneousLoad: "moderate" as const,
    consumers: [
        { name: "LED Licht", power: 30, hoursPerDay: 4, voltage: 24 },
        { name: "Dieselheizung", power: 15, hoursPerDay: 10, voltage: 24 },
        { name: "Kühlschrank", power: 60, hoursPerDay: 24, voltage: 24, isCooling: true },
        { name: "Laptop", power: 65, hoursPerDay: 4, voltage: 230 },
        { name: "Handys laden", power: 20, hoursPerDay: 2, voltage: 230 },
        { name: "Wasserpumpe", power: 50, hoursPerDay: 0.5, voltage: 24 },
        { name: "Boiler", power: 500, hoursPerDay: 0.5, voltage: 230 }, // Will be used but often can't in winter
        { name: "Backofen", power: 2000, hoursPerDay: 0.2, voltage: 230 } // Occasional use
    ],

    // Kabellängen
    cableLengths: {
        starterToBooster: 4,
        boosterToService: 1.5,
        serviceToInverter: 0.5,
        solarToRegulator: 6,
        regulatorToService: 2,
        chargerToService: 2
    }
};

// =============================================================================
// ALGORITHMUS
// =============================================================================

function runAlgorithm(input: typeof USER_INPUT) {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("   CAMPER ELECTRICAL ALGORITHM v7.0 - REDESIGNED               ");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");

    const sysV = input.systemVoltage;
    const dod = CONFIG.BATTERY.DOD[input.batteryPreference];

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 1: VERBRAUCHS-ANALYSE
    // ─────────────────────────────────────────────────────────────────────────
    let dailyWh = 0;
    let totalAcWatts = 0;
    let maxSingleAcWatt = 0;

    input.consumers.forEach(c => {
        let wh: number;

        if (c.isCooling) {
            // Kühlschrank: 25% Duty Cycle (Kompressor läuft nicht durchgehend)
            wh = c.power * 24 * 0.25;
        } else {
            wh = c.power * c.hoursPerDay;
        }

        // 230V-Geräte: Inverter-Verlust einrechnen
        if (c.voltage === 230) {
            wh = wh / CONFIG.INVERTER.EFFICIENCY;
            totalAcWatts += c.power;
            if (c.power > maxSingleAcWatt) maxSingleAcWatt = c.power;
        }

        dailyWh += wh;
    });

    console.log("┌─ VERBRAUCH ─────────────────────────────────────────────────┐");
    console.log(`│ Tagesverbrauch:          ${Math.round(dailyWh).toString().padStart(6)} Wh                       │`);
    console.log(`│ Max. AC-Last (einzeln):  ${Math.round(maxSingleAcWatt).toString().padStart(6)} W                        │`);
    console.log(`│ Gesamt AC-Last:          ${Math.round(totalAcWatts).toString().padStart(6)} W                        │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 2: SOLAR-ERTRAG BERECHNUNG
    // ─────────────────────────────────────────────────────────────────────────
    const psh = CONFIG.PSH[input.season]?.[input.winterLocation] ?? 3.0;
    const moduleEff = CONFIG.SOLAR.MODULE_TYPE[input.roofModuleType];

    // Wh pro Wp unter verschiedenen Bedingungen
    const whPerWp_roof_normal = psh * CONFIG.SOLAR.ORIENTATION.roof * CONFIG.SOLAR.SYSTEM_LOSS * moduleEff;
    const whPerWp_roof_cloudy = whPerWp_roof_normal * CONFIG.SOLAR.CLOUDY_FACTOR;
    const whPerWp_portable_normal = psh * CONFIG.SOLAR.ORIENTATION.portable * CONFIG.SOLAR.SYSTEM_LOSS;
    const whPerWp_portable_cloudy = whPerWp_portable_normal * CONFIG.SOLAR.CLOUDY_FACTOR;

    // Max. Dach-Wp basierend auf Fläche
    const totalRoofAreaM2 = input.roofAreas.reduce((acc, area) =>
        acc + (area.length * area.width) / 10000, 0);
    const maxRoofWp = Math.floor(
        totalRoofAreaM2 *
        CONFIG.SOLAR.ROOF_UTILIZATION *
        CONFIG.SOLAR.TETRIS_FACTOR *
        CONFIG.SOLAR.WP_PER_M2
    );

    // Vorhandene Solartaschen
    const existingPortableWp = input.solarBags.reduce((sum, bag) => sum + bag.power, 0);

    console.log("┌─ SOLAR POTENZIAL ───────────────────────────────────────────┐");
    console.log(`│ Dachfläche:              ${totalRoofAreaM2.toFixed(2).padStart(6)} m²                       │`);
    console.log(`│ Max. Dach-Wp:            ${maxRoofWp.toString().padStart(6)} Wp                       │`);
    console.log(`│ Peak Sun Hours (PSH):    ${psh.toFixed(1).padStart(6)} h                        │`);
    console.log(`│ Ertrag/Wp (Dach, normal): ${whPerWp_roof_normal.toFixed(2).padStart(5)} Wh/Wp                    │`);
    console.log(`│ Ertrag/Wp (Dach, cloudy): ${whPerWp_roof_cloudy.toFixed(2).padStart(5)} Wh/Wp                    │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 3: BENÖTIGTE SOLAR-LEISTUNG (RÜCKRECHNUNG)
    // ─────────────────────────────────────────────────────────────────────────
    // Empfohlen: Deckung bei normalem Wetter + Buffer
    const requiredWp_recommended = (dailyWh / whPerWp_roof_normal) * CONFIG.SOLAR.RECOMMENDED_BUFFER;
    // Schlechtwetter: Was wäre nötig um auch bei Wolken durchzukommen?
    const requiredWp_badWeather = dailyWh / whPerWp_roof_cloudy;

    // Solar-Verteilung: Erst Dach ausnutzen, dann Solartaschen
    let recRoofWp = Math.min(maxRoofWp, requiredWp_recommended);
    let recPortableWp = 0;

    // Falls Dach nicht ausreicht → Solartaschen (max 400Wp)
    if (requiredWp_recommended > maxRoofWp) {
        const deficit = requiredWp_recommended - maxRoofWp;
        recPortableWp = Math.min(CONFIG.SOLAR.MAX_PORTABLE_WP, deficit);
    }

    // Falls bereits Solartaschen vorhanden, diese berücksichtigen
    const finalPortableWp = Math.max(recPortableWp, existingPortableWp);
    const totalRecommendedWp = recRoofWp + finalPortableWp;

    // Tatsächlicher Ertrag
    const yieldNormalWh = (recRoofWp * whPerWp_roof_normal) + (finalPortableWp * whPerWp_portable_normal);
    const yieldCloudyWh = (recRoofWp * whPerWp_roof_cloudy) + (finalPortableWp * whPerWp_portable_cloudy);

    console.log("┌─ SOLAR DIMENSIONIERUNG ─────────────────────────────────────┐");
    console.log(`│ Benötigt (empfohlen):    ${Math.round(requiredWp_recommended).toString().padStart(6)} Wp                       │`);
    console.log(`│ Benötigt (Schlechtwetter): ${Math.round(requiredWp_badWeather).toString().padStart(4)} Wp                       │`);
    console.log(`│ ───────────────────────────────────────────────────────────── │`);
    console.log(`│ EMPFOHLEN DACH:          ${Math.round(recRoofWp).toString().padStart(6)} Wp                       │`);
    console.log(`│ EMPFOHLEN SOLARTASCHE:   ${Math.round(finalPortableWp).toString().padStart(6)} Wp                       │`);
    console.log(`│ SUMME:                   ${Math.round(totalRecommendedWp).toString().padStart(6)} Wp                       │`);
    console.log(`│ ───────────────────────────────────────────────────────────── │`);
    console.log(`│ Ertrag (normal):         ${Math.round(yieldNormalWh).toString().padStart(6)} Wh                       │`);
    console.log(`│ Ertrag (Schlechtwetter): ${Math.round(yieldCloudyWh).toString().padStart(6)} Wh                       │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 4: LADEBOOSTER-BEITRAG
    // ─────────────────────────────────────────────────────────────────────────
    let boosterA = 0;
    let alternatorWhPerDay = 0;

    if (input.energySources.includes("alternator")) {
        boosterA = CONFIG.BOOSTER[input.alternatorSize] ?? 20;
        const driveHours = CONFIG.DRIVE_HOURS[input.standingDuration] ?? 0.5;
        alternatorWhPerDay = boosterA * sysV * driveHours;
    }

    console.log("┌─ LADEBOOSTER ───────────────────────────────────────────────┐");
    console.log(`│ Booster-Größe:           ${boosterA.toString().padStart(6)} A                        │`);
    console.log(`│ Fahrzeit/Tag:            ${(CONFIG.DRIVE_HOURS[input.standingDuration] ?? 0).toFixed(1).padStart(6)} h                        │`);
    console.log(`│ Ertrag/Tag:              ${Math.round(alternatorWhPerDay).toString().padStart(6)} Wh                       │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 5: BATTERIE-DIMENSIONIERUNG
    // ─────────────────────────────────────────────────────────────────────────
    // Tägliches Defizit bei Schlechtwetter
    const dailyDeficitCloudy = Math.max(0, dailyWh - yieldCloudyWh - alternatorWhPerDay);
    const dailyDeficitNormal = Math.max(0, dailyWh - yieldNormalWh - alternatorWhPerDay);

    // Backup-Tage (wie lange muss Batterie ohne volle Ladung überleben?)
    const backupDays = CONFIG.BACKUP_DAYS[input.tripDuration] ?? 3;

    // Benötigte Wh für Backup-Zeitraum
    const backupNeededWh = dailyDeficitCloudy * backupDays;

    // Umrechnung in Ah
    const rawAh = backupNeededWh / sysV;
    const recAh = (rawAh / dod) * CONFIG.BATTERY.SAFETY_BUFFER;

    // Space-Limit prüfen
    const spaceLimit = CONFIG.BATTERY.SPACE_LIMITS[input.batterySpaceSize] ?? 200;
    const minCapacity = CONFIG.BATTERY.MIN_CAPACITY[`v${sysV}` as keyof typeof CONFIG.BATTERY.MIN_CAPACITY] ?? 100;

    const finalRecAh = Math.max(minCapacity, Math.round(recAh));
    const isSpaceLimited = finalRecAh > spaceLimit;

    console.log("┌─ BATTERIE DIMENSIONIERUNG ──────────────────────────────────┐");
    console.log(`│ Defizit/Tag (cloudy):    ${Math.round(dailyDeficitCloudy).toString().padStart(6)} Wh                       │`);
    console.log(`│ Defizit/Tag (normal):    ${Math.round(dailyDeficitNormal).toString().padStart(6)} Wh                       │`);
    console.log(`│ Backup-Tage:             ${backupDays.toString().padStart(6)} Tage                     │`);
    console.log(`│ Benötigte Reserve:       ${Math.round(backupNeededWh).toString().padStart(6)} Wh                       │`);
    console.log(`│ ───────────────────────────────────────────────────────────── │`);
    console.log(`│ Roh-Kapazität:           ${Math.round(rawAh).toString().padStart(6)} Ah @ ${sysV}V                 │`);
    console.log(`│ Mit DoD + Buffer:        ${Math.round(recAh).toString().padStart(6)} Ah @ ${sysV}V                 │`);
    console.log(`│ ───────────────────────────────────────────────────────────── │`);
    console.log(`│ EMPFOHLEN:               ${finalRecAh.toString().padStart(6)} Ah @ ${sysV}V                 │`);
    console.log(`│ Platz-Limit:             ${spaceLimit.toString().padStart(6)} Ah (${input.batterySpaceSize})               │`);
    if (isSpaceLimited) {
        console.log(`│ ⚠️  WARNUNG: Empf. überschreitet Platz-Limit!               │`);
    }
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 6: WECHSELRICHTER
    // ─────────────────────────────────────────────────────────────────────────
    const simFactor = CONFIG.INVERTER.SIM_FACTORS[input.simultaneousLoad] ?? 0.5;
    const calcInverterW = maxSingleAcWatt + ((totalAcWatts - maxSingleAcWatt) * simFactor);
    const recInverterW = CONFIG.INVERTER.CLASSES.find(c => c >= calcInverterW) ?? 5000;

    console.log("┌─ WECHSELRICHTER ─────────────────────────────────────────────┐");
    console.log(`│ Berechnet:               ${Math.round(calcInverterW).toString().padStart(6)} W                        │`);
    console.log(`│ EMPFOHLEN:               ${recInverterW.toString().padStart(6)} W                        │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 7: LADEGERÄT (LANDSTROM)
    // ─────────────────────────────────────────────────────────────────────────
    let chargerA = 0;
    if (input.energySources.includes("shore_power")) {
        const targetHours = CONFIG.CHARGER.TARGET_HOURS[input.shoreChargingSpeed] ?? 8;
        chargerA = Math.ceil(finalRecAh / targetHours);
        chargerA = CONFIG.CHARGER.CLASSES.find(c => c >= chargerA) ?? 60;
    }

    console.log("┌─ LADEGERÄT (LANDSTROM) ─────────────────────────────────────┐");
    console.log(`│ EMPFOHLEN:               ${chargerA.toString().padStart(6)} A                        │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // SCHRITT 8: SOLAR-LADEREGLER
    // ─────────────────────────────────────────────────────────────────────────
    const totalWp = recRoofWp + finalPortableWp;
    const mpptA = Math.ceil((totalWp / sysV) * 1.15); // 15% Safety

    console.log("┌─ SOLAR-LADEREGLER ──────────────────────────────────────────┐");
    console.log(`│ Für Wp:                  ${Math.round(totalWp).toString().padStart(6)} Wp                       │`);
    console.log(`│ EMPFOHLEN:               ${mpptA >= 10 ? `>= ${mpptA}` : "n.a.".padStart(4)} A                        │`);
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log("");

    // ─────────────────────────────────────────────────────────────────────────
    // ZUSAMMENFASSUNG
    // ─────────────────────────────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                     ZUSAMMENFASSUNG                            ");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  Batterie:        ${finalRecAh} Ah @ ${sysV}V (${input.batteryPreference.toUpperCase()})`);
    console.log(`  Solar Dach:      ${Math.round(recRoofWp)} Wp (${input.roofModuleType})`);
    console.log(`  Solartasche:     ${Math.round(finalPortableWp)} Wp`);
    console.log(`  Wechselrichter:  ${recInverterW} W`);
    console.log(`  Ladebooster:     ${boosterA} A`);
    console.log(`  Ladegerät:       ${chargerA} A`);
    console.log(`  Laderegler:      >= ${mpptA} A`);
    console.log("═══════════════════════════════════════════════════════════════");

    // Warnung bei großem Gap zwischen Empfehlung und Platz
    if (isSpaceLimited) {
        console.log("");
        console.log("⚠️  ACHTUNG: Die empfohlene Batteriekapazität übersteigt den");
        console.log(`   verfügbaren Platz (${spaceLimit}Ah). Mögliche Lösungen:`);
        console.log("   1. Mehr Solar installieren (reduziert Batteriebedarf)");
        console.log("   2. Verbrauch reduzieren");
        console.log("   3. Öfter fahren (Alternator-Ladung)");
        console.log("   4. Häufiger Landstrom nutzen");
    }

    return {
        dailyWh: Math.round(dailyWh),
        battery: { recommendedAh: finalRecAh, voltage: sysV, type: input.batteryPreference },
        solar: { roofWp: Math.round(recRoofWp), portableWp: Math.round(finalPortableWp) },
        inverter: { recommendedW: recInverterW },
        booster: { currentA: boosterA },
        charger: { currentA: chargerA },
        mppt: { currentA: mpptA },
        yields: {
            normalWh: Math.round(yieldNormalWh),
            cloudyWh: Math.round(yieldCloudyWh),
            alternatorWh: Math.round(alternatorWhPerDay)
        },
        deficits: {
            normalWh: Math.round(dailyDeficitNormal),
            cloudyWh: Math.round(dailyDeficitCloudy)
        }
    };
}

// =============================================================================
// AUSFÜHREN
// =============================================================================

console.log("\n");
runAlgorithm(USER_INPUT);
console.log("\n");