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
