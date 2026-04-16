import type { AlgorithmOutput } from "@/lib/algorithm/types";

import type { PrefilterResult } from "@/lib/recommendation/types";

function summarizeCalculations(calc: AlgorithmOutput): string {
  return [
    `Batterie: ${calc.battery.recommendedCapacityAh} Ah @ ${calc.battery.voltage} V (${calc.battery.type})`,
    `Solar nötig: ${calc.solar.needed} — Ziel ca. ${calc.solar.requiredWp} Wp, verfügbar ${calc.solar.totalAvailableWp} Wp`,
    `Wechselrichter nötig: ${calc.inverter.needed} — empfohlen ca. ${calc.inverter.recommendedW} W`,
    `Solarregler nötig: ${calc.controller.needed} — empfohlen ca. ${calc.controller.currentA} A`,
  ].join("\n");
}

function formatPrefilterBuckets(pref: PrefilterResult): string {
  const lines: string[] = [];
  const append = (label: string, items: { productId: string; name: string; score: number }[]) => {
    if (items.length === 0) return;
    lines.push(`${label}:`);
    for (const it of items) {
      lines.push(`- ${it.productId} | ${it.name} | score=${it.score.toFixed(0)}`);
    }
  };
  append("Batterie", pref.battery);
  append("Solar", pref.solar);
  append("Wechselrichter", pref.inverter);
  append("Regler", pref.controller);
  append("Kabel", pref.cable);
  append("Sonstiges", pref.other);
  return lines.join("\n");
}

/**
 * Prompt für KI-Produktauswahl — Antwort als JSON (Schema wird in `ai-selector` per Zod geprüft).
 */
export function buildProductSelectionPrompt(params: {
  calculations: AlgorithmOutput;
  prefilter: PrefilterResult;
}): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = [
    "Du bist ein Assistenzsystem für Camping-Bordstrom-Produkte.",
    "Wähle aus der vorgefilterten Liste sinnvolle Produkte; nur IDs aus der Liste verwenden.",
    "Antworte ausschließlich mit gültigem JSON gemäß dem geforderten Schema in der Nutzer-Nachricht.",
  ].join(" ");

  const userPrompt = [
    "## Berechnungs-Kurzfassung",
    summarizeCalculations(params.calculations),
    "",
    "## Vorgefilterte Kandidaten (nur diese productId verwenden)",
    formatPrefilterBuckets(params.prefilter),
    "",
    "## JSON-Schema",
    '{"selections":[{"productId":"string","bucket":"battery|solar|inverter|controller|cable|other","reasonDe":"string"}]}',
    "Maximal 12 Einträge, nur sinnvolle Kombination; reasonDe kurz (1–2 Sätze), Deutsch.",
  ].join("\n");

  return { systemInstruction, userPrompt };
}
