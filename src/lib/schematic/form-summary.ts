import { parseAlgorithmInput } from "@/lib/schemas/wizard-input";

export function buildFormSummaryDe(formData: unknown): string {
  try {
    const input = parseAlgorithmInput(formData);
    const energy = input.energySources?.length ? input.energySources.join(", ") : "—";
    return [
      `Bordnetz ${input.systemVoltage} V (Fahrzeug ${input.vehicleVoltage} V).`,
      `Batterie-Präferenz: ${input.batteryPreference}.`,
      `Energiequellen: ${energy}.`,
      `Autarkie-Ziel: ${input.autarchyDays === 999 ? "Maximum" : `${input.autarchyDays} Tage`}.`,
      `Verbraucher: ${input.consumers.length} Eintrag/Einträge.`,
      `Gleichzeitigkeit Lasten: ${input.simultaneousLoad}.`,
    ].join(" ");
  } catch {
    return "Formular konnte nicht vollständig geparst werden — Rohdaten werden im JSON-Kontext mitgegeben.";
  }
}
