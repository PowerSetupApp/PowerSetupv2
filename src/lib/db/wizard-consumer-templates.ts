import type { ConsumerVoltage } from "@/lib/algorithm/types";

import { getPrisma } from "./client";

/** Serializable presets for Wizard Schritt 3 (aus `ConsumerDevice`). */
export type WizardConsumerTemplate = {
  id: string;
  name: string;
  categoryName: string;
  defaultPower: number;
  defaultHoursPerDay: number;
  defaultVoltage: ConsumerVoltage;
  isCooling: boolean;
};

function parseDefaultVoltage(raw: string): ConsumerVoltage {
  const u = raw.trim().toUpperCase();
  if (u.includes("230")) return 230;
  return 12;
}

/**
 * Lädt aktive Verbraucher-Vorlagen aus der Datenbank (Admin → ConsumerDevice).
 * Ohne `DATABASE_URL` oder bei DB-Fehler: leeres Array (Wizard bleibt nutzbar).
 */
export async function listWizardConsumerTemplates(): Promise<WizardConsumerTemplate[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const prisma = getPrisma();
    const rows = await prisma.consumerDevice.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { isFeatured: "desc" },
        { sortOrder: "asc" },
      ],
    });

    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      categoryName: d.category.name,
      defaultPower: d.defaultPower,
      defaultHoursPerDay: d.defaultHoursPerDay,
      defaultVoltage: parseDefaultVoltage(d.defaultVoltage),
      isCooling: d.isCooling,
    }));
  } catch {
    return [];
  }
}
