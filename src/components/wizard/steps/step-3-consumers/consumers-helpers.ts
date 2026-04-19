import type { Consumer, ConsumerVoltage, SystemVoltage } from "@/lib/algorithm/types";
import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";

export function newConsumerId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c-${Date.now()}`;
}

/** DC-Katalogeintrag auf die gewählte Bordspannung abbilden; 230-V bleibt AC-Seite. */
export function templateToConsumerVoltage(
  templateDefault: ConsumerVoltage,
  systemVoltage: SystemVoltage,
): ConsumerVoltage {
  if (templateDefault === 230) return 230;
  return systemVoltage;
}

export function defaultConsumer(systemVoltage: SystemVoltage): Consumer {
  return {
    id: newConsumerId(),
    name: "Neuer Verbraucher",
    power: 20,
    daily: 2,
    voltage: systemVoltage,
  };
}

/** Anzahl Verbraucher, die aus dieser Katalog-Vorlage stammen (`sourceDeviceId`). */
export function countConsumersFromTemplate(consumers: Consumer[], templateId: string): number {
  return consumers.reduce((n, c) => n + (c.sourceDeviceId === templateId ? 1 : 0), 0);
}

export function consumerFromTemplate(t: WizardConsumerTemplate, systemVoltage: SystemVoltage): Consumer {
  const base: Consumer = {
    id: newConsumerId(),
    name: t.name,
    power: t.defaultPower,
    daily: t.defaultHoursPerDay,
    voltage: templateToConsumerVoltage(t.defaultVoltage, systemVoltage),
    sourceDeviceId: t.id,
    deviceIcon: t.deviceIcon,
    categoryIcon: t.categoryIcon,
    showHoursField: t.showHoursField,
    dailyStep: t.stepHours,
    averageLoadPercent: t.averageLoadPercent ?? undefined,
  };
  if (t.isCooling) {
    return { ...base, coolingMethod: "compressor" };
  }
  return base;
}
