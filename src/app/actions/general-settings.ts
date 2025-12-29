"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface GeneralSettings {
    amazonPartnerTag: string;
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "amazon_partner_tag" },
        });

        return {
            amazonPartnerTag: setting?.value || "",
        };
    } catch (error) {
        console.warn("Failed to fetch general settings:", error);
        return { amazonPartnerTag: "" };
    }
}

export async function updateGeneralSettings(settings: GeneralSettings) {
    try {
        await prisma.systemSetting.upsert({
            where: { key: "amazon_partner_tag" },
            update: { value: settings.amazonPartnerTag },
            create: { key: "amazon_partner_tag", value: settings.amazonPartnerTag },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update general settings:", error);
        throw new Error("Fehler beim Speichern der Einstellungen");
    }
}
