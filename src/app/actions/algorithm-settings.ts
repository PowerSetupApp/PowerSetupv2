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
    solarControllerClasses: string;
    cableSizes: string;

    // Voltage Drop
    voltageDropCritical: number;
    voltageDropNormal: number;
    voltageDropSolar: number;

    // Copper
    copperResistivity: number;
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
            data: { id: "default" }
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
        await prisma.algorithmSettings.upsert({
            where: { id: "default" },
            update: data,
            create: { id: "default", ...data }
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
        const inverters = await prisma.product.findMany({
            where: {
                isActive: true,
                category: { slug: { contains: "inverter" } }, // Safe assumption
                powerW: { not: null }
            },
            distinct: ['powerW'],
            select: { powerW: true },
            orderBy: { powerW: 'asc' }
        });
        const inverterClasses = inverters.map(p => p.powerW).filter(Boolean).join(',');

        // 2. Chargers: Distinct currentA
        const chargers = await prisma.product.findMany({
            where: {
                isActive: true,
                category: { slug: { contains: "charger" } }, // "charger", "battery-charger"
                currentA: { not: null }
            },
            distinct: ['currentA'],
            select: { currentA: true },
            orderBy: { currentA: 'asc' }
        });
        const chargerClasses = chargers.map(p => p.currentA).filter(Boolean).join(',');

        // 3. Solar Controllers: Distinct currentA
        // Make sure we don't mix with chargers. "laderegler", "solar", "controller"
        const solarControllers = await prisma.product.findMany({
            where: {
                isActive: true,
                category: {
                    OR: [
                        { slug: { contains: "solar" } },
                        { slug: { contains: "regler" } },
                        { slug: { contains: "controller" } }
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
