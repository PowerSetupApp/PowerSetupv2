import type { ConsumerVoltage } from "@/lib/algorithm/types";
import { normalizeIconKey } from "@/lib/icons/normalize-icon-key";

import { getPrisma } from "../client";
import { readFromDatabase, type DbReadResult } from "../prisma-errors";

/** Serializable presets for Wizard Schritt 3 (aus `ConsumerDevice`). */
export type WizardConsumerTemplate = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categorySortOrder: number;
  categoryIcon: string | null;
  deviceIcon: string | null;
  defaultPower: number;
  defaultHoursPerDay: number;
  defaultVoltage: ConsumerVoltage;
  isCooling: boolean;
  showHoursField: boolean;
  stepHours: number;
  /** Durchschnittliche Leistung in % der Nennleistung; `null` ⇒ 100 %. */
  averageLoadPercent: number | null;
};

function parseDefaultVoltage(raw: string): ConsumerVoltage {
  const u = raw.trim().toUpperCase();
  if (u.includes("230")) return 230;
  if (u.includes("48")) return 48;
  if (u.includes("24")) return 24;
  return 12;
}

/**
 * Lädt aktive Verbraucher-Vorlagen (Admin → ConsumerDevice).
 *
 * Bewusst **ohne** `use cache`: Der Katalog muss zuverlässig dem aktuellen DB-
 * Stand entsprechen. Mit Cache Components konnte ein früherer leerer/fehlender
 * Stand länger ausgeliefert werden, während Admin-Listen (ohne denselben Cache)
 * aktuelle Zeilen zeigten.
 *
 * Fehlerbehandlung folgt `readFromDatabase`: u. a. unerreichbare DB und
 * fehlende Migrationen (Prisma P2022/P2021) liefern `database_unavailable`, damit
 * der Wizard mit leerem Katalog weiterläuft. Echte Query-/Validierungsfehler
 * werden weiterhin durchgereicht.
 */
export async function listWizardConsumerTemplates(): Promise<
  DbReadResult<WizardConsumerTemplate[]>
> {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.consumerDevice.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: { id: true, name: true, sortOrder: true, icon: true },
        },
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { isFeatured: "desc" },
        { sortOrder: "asc" },
      ],
    });

    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      categoryId: d.category.id,
      categoryName: d.category.name,
      categorySortOrder: d.category.sortOrder,
      categoryIcon: normalizeIconKey(d.category.icon),
      deviceIcon: normalizeIconKey(d.icon),
      defaultPower: d.defaultPower,
      defaultHoursPerDay: d.defaultHoursPerDay,
      defaultVoltage: parseDefaultVoltage(d.defaultVoltage),
      isCooling: d.isCooling,
      showHoursField: d.showHoursField,
      stepHours: d.stepHours,
      averageLoadPercent: d.averageLoadPercent,
    }));
  });
}
