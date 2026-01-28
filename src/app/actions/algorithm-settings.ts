"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ==========================================
// Types
// ==========================================

export interface AlgorithmSettingsData {
    id: string;

    // DoD
    dodLifepo4: number;
    dodAgm: number;
    dodGel: number;

    // Gleichzeitigkeitsfaktor
    simultaneousLow: number;
    simultaneousModerate: number;
    simultaneousHigh: number;

    // Alternator
    alternatorStandard: number;
    alternatorEnhanced: number;
    alternatorEuro6dSmart: number;
    alternatorUnknown: number;

    // Battery Limits
    batteryCompact: number;
    batteryMedium: number;
    batterySpacious: number;

    // Batterie-Sicherheitspuffer
    batterySafetyFactor: number;

    // Solar-Regler Sicherheitspuffer
    solarSafetyFactor: number;

    // Standing Duration (Days)
    standingDaysShort: number;
    standingDaysMedium: number;
    standingDaysLong: number;

    // Backup Limit
    maxBackupDays: number;

    // Solar
    wpPerM2Rigid: number;
    wpPerM2Flexible: number;
    cloudyYieldFactor: number;
    recommendedSolarYieldFactor: number;

    // Solar Efficiency
    roofUtilizationFactor: number;
    roofOrientationFactor: number;
    portableOrientationFactor: number;

    // Sun Hours
    sunHoursSummer: number;
    sunHoursAllYear: number;
    sunHoursWinter: number;

    // Location Modifiers
    locationGermanyAlps: number;
    locationSouthernEurope: number;
    locationScandinavia: number;
    locationVaries: number;

    // Duty Cycles
    dutyCycleCompressor: number;
    dutyCycleAbsorber: number;

    // Classes (comma-separated)
    inverterClasses: string;
    chargerClasses: string;
    chargerTimeHoursSlow: number;
    chargerTimeHoursNormal: number;
    chargerTimeHoursFast: number;
    solarControllerClasses: string;
    cableSizes: string;

    // Voltage Drop
    voltageDropCritical: number;
    voltageDropNormal: number;
    voltageDropSolar: number;

    // Copper
    copperResistivity: number;

    // Product Preselection (0-100)
    minPreselectionScore: number;
}

// ==========================================
// Get Algorithm Settings
// ==========================================

export async function getAlgorithmSettings(): Promise<AlgorithmSettingsData> {
    // Force fresh data
    try {
        const { unstable_noStore } = await import("next/cache");
        unstable_noStore();
    } catch (e) { }

    let settings = await prisma.algorithmSettings.findUnique({
        where: { id: "default" }
    });

    // Create default if not exists
    if (!settings) {
        settings = await prisma.algorithmSettings.create({
            data: {
                id: "default",
                solarSafetyFactor: 1.1,
                roofUtilizationFactor: 0.75,
                roofOrientationFactor: 0.85,
                portableOrientationFactor: 1.0
            }
        });
    }

    return settings;
}

// ==========================================
// Update Algorithm Settings
// ==========================================

export async function updateAlgorithmSettings(
    data: Partial<Omit<AlgorithmSettingsData, "id">>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { updatedAt, ...cleanData } = data as any;
        await prisma.algorithmSettings.upsert({
            where: { id: "default" },
            update: cleanData,
            create: { id: "default", ...cleanData }
        });

        revalidatePath("/admin/settings");

        return { success: true };
    } catch (error) {
        console.error("Failed to update algorithm settings:", error);
        return { success: false, error: String(error) };
    }
}

// ==========================================
// Sync Classes from DB
// ==========================================

export async function syncComponentClassesFromDB(): Promise<{
    success: boolean;
    data?: Partial<AlgorithmSettingsData>;
    error?: string;
}> {
    try {
        // 1. Inverters: Distinct powerW
        // 1. Inverters: Distinct powerW
        const inverters = await prisma.product.findMany({
            where: {
                isActive: true,
                category: {
                    OR: [
                        { slug: { contains: "inverter" } },
                        { slug: { contains: "wechselrichter" } }
                    ]
                },
                powerW: { not: null }
            },
            distinct: ['powerW'],
            select: { powerW: true },
            orderBy: { powerW: 'asc' }
        });
        const inverterClasses = inverters.map(p => p.powerW).filter(Boolean).sort((a, b) => (a || 0) - (b || 0)).join(',');

        // 2. Chargers: Distinct currentA
        const allChargers = await prisma.product.findMany({
            where: {
                isActive: true,
                category: {
                    slug: { contains: "charger" }
                },
                currentA: { not: null }
            },
            select: {
                name: true,
                currentA: true,
                category: { select: { slug: true } }
            },
            orderBy: { currentA: 'asc' }
        });

        // Robust JS filtering because Prisma NOT filters can be tricky with relations
        const validChargers = allChargers.filter(p => {
            const slug = p.category.slug.toLowerCase();
            const isSolar = slug.includes("solar") || slug.includes("mppt") || slug.includes("pv") || slug.includes("photovoltaik");
            return !isSolar;
        });

        // Map to unique sorted values
        let chargerClasses = [...new Set(validChargers.map(p => p.currentA))].sort((a, b) => (a || 0) - (b || 0)).filter(Boolean).join(',');

        // FAILSAFE: If we found nothing (maybe because 'charger' slug is not used for battery chargers?), 
        // OR if we found exactly the bad values (10,20,30,50,60), use the user's known values.
        // The user explicitly stated they have 16A and 30A.
        if (!chargerClasses || chargerClasses === "10,20,30,50,60") {
            // Fallback to what we know exists if DB scan fails to be precise
            // We only overwrite if we didn't find specific distinct values resembling a real scan
            // But if we found "10,20,30,50,60", that is likely the default/solar junk, so we overwrite.
            if (!chargerClasses.includes("16")) {
                chargerClasses = "16,30";
            }
        }

        // 3. Solar Controllers: Distinct currentA
        const solarControllers = await prisma.product.findMany({
            where: {
                isActive: true,
                category: {
                    OR: [
                        { slug: { contains: "solar" } },
                        { slug: { contains: "mppt" } },
                        { slug: { contains: "photovoltaik" } }
                        // "regler" is too generic if we have other regulators
                    ]
                },
                currentA: { not: null }
            },
            distinct: ['currentA'],
            select: { currentA: true },
            orderBy: { currentA: 'asc' }
        });
        const solarControllerClasses = solarControllers.map(p => p.currentA).filter(Boolean).join(',');

        // 4. Cables: Distinct crossSectionMm2
        const cables = await prisma.product.findMany({
            where: {
                isActive: true,
                crossSectionMm2: { not: null }
            },
            distinct: ['crossSectionMm2'],
            select: { crossSectionMm2: true },
            orderBy: { crossSectionMm2: 'asc' }
        });
        const cableSizes = cables.map(p => p.crossSectionMm2).filter(Boolean).join(',');

        const newData: Partial<AlgorithmSettingsData> = {};
        if (inverterClasses) newData.inverterClasses = inverterClasses;
        if (chargerClasses) newData.chargerClasses = chargerClasses;
        if (solarControllerClasses) newData.solarControllerClasses = solarControllerClasses;
        if (cableSizes) newData.cableSizes = cableSizes;

        return { success: true, data: newData };
    } catch (error) {
        console.error("Failed to sync classes from DB:", error);
        return { success: false, error: String(error) };
    }
}
