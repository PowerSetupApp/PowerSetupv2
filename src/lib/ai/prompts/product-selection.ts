import type { AlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import { mergeAlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import type { AlgorithmOutput } from "@/lib/algorithm/types";

import { bmsDischargeAFromRow, productNominalSystemVoltageV } from "@/lib/recommendation/battery-product-spec";
import { requiredInverterDischargeA } from "@/lib/recommendation/bms-inverter";
import type { PrefilterResult, ProductRecommendationRow } from "@/lib/recommendation/types";

function summarizeCalculations(calc: AlgorithmOutput): string {
  return [
    `Batterie: ${calc.battery.recommendedCapacityAh} Ah @ ${calc.battery.voltage} V (${calc.battery.type})`,
    `Solar nötig: ${calc.solar.needed} — Ziel ca. ${calc.solar.requiredWp} Wp, verfügbar ${calc.solar.totalAvailableWp} Wp`,
    `Wechselrichter nötig: ${calc.inverter.needed} — empfohlen ca. ${calc.inverter.recommendedW} W`,
    `Solarregler nötig: ${calc.controller.needed} — empfohlen ca. ${calc.controller.currentA} A`,
  ].join("\n");
}

type PrefilterBucketListContext = {
  productsById?: Map<string, ProductRecommendationRow>;
  calculations?: AlgorithmOutput;
  tuning?: Pick<AlgorithmTuning, "inverterEfficiency">;
};

function formatPrefilterBuckets(
  pref: PrefilterResult,
  includeRules = true,
  listCtx: PrefilterBucketListContext = {},
): string {
  const lines: string[] = [];
  if (includeRules) {
    lines.push(
      "Wichtig: Verwende ausschließlich die folgenden productId-Werte — keine anderen IDs erfinden.",
      "Anforderungen: Batterie-Kapazität ≥ Ziel-Ah (siehe Kurzfassung), Nennspannung wie Ziel, BMS-Dauerstrom ≥ Ziel-I_dc (falls in der Zeile). Solar: Gesamtleistung (Modulanzahl × Wp) ≥ requiredWp.",
      "Für `reasonDe`: Nenne nur Fakten aus der jeweiligen Kandidatenzeile (inkl. Ah, V, BMS A) und der Berechnungs-Kurzfassung; keine frei erfundenen Ah-, Spannungs- oder BMS-Werte, die nicht in der Zeile stehen.",
      "Mehrere Kabel-Einträge wählen für unterschiedliche Leitungspfade, wenn unter „Kabel pro Strecke“ gelistet.",
      "Mehrere Sicherungen aus „Sonstiges“ möglich, wenn passende Stromwerte gelistet sind.",
    );
    const c = listCtx.calculations;
    const t = listCtx.tuning;
    if (c?.inverter.needed && t) {
      const iDc = requiredInverterDischargeA(c, t);
      lines.push(
        `Hinweis: Am DC-Akku ist für den Wechselrichter mit der gewählten Gleichzeitigkeit ca. ${iDc.toFixed(1)} A nötig (I_dc = Wechselrichter-W in der Kurzfassung / (Bordspannung × Wirkungsgrad); die Wattzahl enthält den Gleichzeitigkeits-Peakfaktor bereits).`,
      );
    }
  }
  const { productsById } = listCtx;
  const appendBattery = () => {
    if (pref.battery.length === 0) return;
    lines.push("Batterie:");
    for (const it of pref.battery) {
      const row = productsById?.get(it.productId);
      if (row) {
        const bms = bmsDischargeAFromRow(row);
        const vNom = productNominalSystemVoltageV(row);
        const ah = row.capacityAh;
        const bmsS = bms != null ? `${bms} A` : "—";
        const vS = vNom != null ? `${vNom} V` : "—";
        const ahS = ah != null ? `${ah} Ah` : "—";
        lines.push(
          `- ${it.productId} | ${it.name} | ${ahS} | U=${vS} | BMS=${bmsS} | score=${it.score.toFixed(0)}`,
        );
      } else {
        lines.push(`- ${it.productId} | ${it.name} | score=${it.score.toFixed(0)}`);
      }
    }
  };
  const append = (label: string, items: { productId: string; name: string; score: number }[]) => {
    if (items.length === 0) return;
    lines.push(`${label}:`);
    for (const it of items) {
      lines.push(`- ${it.productId} | ${it.name} | score=${it.score.toFixed(0)}`);
    }
  };
  appendBattery();
  append("Solar", pref.solar);
  append("Wechselrichter", pref.inverter);
  append("Regler (Dach/MPPT)", pref.controller);
  if (pref.controllerPortable?.length) {
    append("Regler Portable", pref.controllerPortable);
  }
  append("Kabel (Katalog)", pref.cable);
  if (pref.cableByRoute?.length) {
    lines.push("Kabel pro Strecke (empfohlen je Leitungspfad eine ID):");
    for (const c of pref.cableByRoute) {
      lines.push(
        `- ${c.productId} | ${c.name} | Strecke: ${c.displayName} (${c.route}) | score=${c.score.toFixed(0)}`,
      );
    }
  }
  append("Sonstiges", pref.other);
  return lines.join("\n");
}

function buildRequirementsBlock(calc: AlgorithmOutput): string {
  return [
    `- Batterie: mind. ${calc.battery.recommendedCapacityAh} Ah @ ${calc.battery.voltage} V, Typ ${calc.battery.type}`,
    `- Solar: nötig=${calc.solar.needed}, Ziel ca. ${Math.round(calc.solar.requiredWp)} Wp, verfügbar ${Math.round(calc.solar.totalAvailableWp)} Wp`,
    `- Ladebooster (B2B): nötig=${calc.booster.needed}, Ziel ca. ${calc.booster.outputCurrentA} A (${calc.booster.outputVoltage} V Bank)`,
    `- Landstrom-Ladegerät: nötig=${calc.charger.needed}, Ziel Ladestrom ca. ${calc.charger.recommendedCurrentA} A`,
    `- Wechselrichter: nötig=${calc.inverter.needed}, empfohlen ca. ${calc.inverter.recommendedW} W`,
    `- Solar-Laderegler (Dach): nötig=${calc.controller.needed}, ${calc.controller.type}, ca. ${calc.controller.currentA} A, max Eingang ca. ${Math.round(calc.controller.maxInputWp)} Wp`,
    `- Solar-Laderegler (Portable): nötig=${calc.portableController.needed}, ca. ${calc.portableController.currentA} A`,
  ].join("\n");
}

function formatFullProductCatalog(products: ProductRecommendationRow[]): string {
  const lines: string[] = [
    "Alle aktiven Katalog-Produkte (nur diese UUIDs verwenden):",
    "Format: productId | Name | Kategorie | Ah | V | Wp | W | A | mm²",
  ];
  for (const p of products) {
    const name = p.name.replace(/\|/g, "/");
    lines.push(
      [
        p.id,
        name,
        p.categoryName || p.categorySlug,
        p.capacityAh ?? "-",
        p.voltageV ?? "-",
        p.solarWp ?? "-",
        p.powerW ?? "-",
        p.currentA ?? "-",
        p.crossSectionMm2 ?? "-",
      ].join(" | "),
    );
  }
  return lines.join("\n");
}

const DEFAULT_SYSTEM_INSTRUCTION = [
  "Du bist ein Assistenzsystem für Camping-Bordstrom-Produkte.",
  "Wähle aus der vorgefilterten Liste sinnvolle Produkte; nur IDs aus der Liste verwenden.",
  "Im Feld `reasonDe` nenne nur technische Fakten, die in der jeweiligen Kandidatenzeile (inkl. Ah, Nennspannung, ggf. BMS in A) und in der Kurzfassung wirklich vorkommen — keine erfundenen Kapazitäts-, Spannungs- oder BMS-Werte.",
  "Antworte ausschließlich mit gültigem JSON (Root-Objekt, siehe Schema) — kein Markdown, kein Code-Block, kein Fließtext davor oder danach.",
].join(" ");

function buildProductContext(
  calculations: AlgorithmOutput,
  prefilter: PrefilterResult,
  listCtx: PrefilterBucketListContext = {},
): string {
  const tuning = listCtx.tuning ?? mergeAlgorithmTuning({});
  return [
    "## Berechnungs-Kurzfassung",
    summarizeCalculations(calculations),
    "",
    "## Vorgefilterte Kandidaten (nur diese productId verwenden)",
    formatPrefilterBuckets(prefilter, true, {
      ...listCtx,
      calculations: listCtx.calculations ?? calculations,
      tuning: listCtx.tuning ?? tuning,
    }),
  ].join("\n");
}

function buildPromptFormatBlock(): string {
  return [
    "## JSON-Schema",
    '{"selections":[{"productId":"string","bucket":"battery|solar|inverter|controller|cable|other","reasonDe":"string"}]}',
    "Maximal 24 Einträge; reasonDe pro Zeile kurz (1–2 Sätze), Deutsch — Feld darf auch \"\" sein.",
    "Wähle für jede gelistete Kabel-Strecke eine passende productId aus „Kabel pro Strecke“ oder „Kabel (Katalog)“.",
  ].join("\n");
}

/**
 * Prompt für KI-Produktauswahl — Antwort als JSON (Schema wird in `ai-selector` per Zod geprüft).
 *
 * Admin-Vorlage (optional): Platzhalter `{{PRODUCT_CONTEXT}}`, `{{PROMPT_FORMAT}}`,
 * `{{REQUIREMENTS}}`, `{{PRESELECTION}}` — ohne bekannte Platzhalter wird der gesamte Text als Nutzer-Prompt verwendet.
 */
export function buildProductSelectionPrompt(params: {
  calculations: AlgorithmOutput;
  prefilter: PrefilterResult;
  /** Aktiver Katalog (für `{{PRODUCT_CONTEXT}}` in Admin-Vorlagen). */
  products?: ProductRecommendationRow[];
  /** Für Batteriezeilen: Ah, U, BMS + I_dc-Hinweis (η aus Tuning). */
  tuning?: Pick<AlgorithmTuning, "inverterEfficiency">;
  /** Aus Admin „KI & Modelle“ → Prompt: Empfehlungen */
  userPromptTemplate?: string;
  /** Aktiver PromptVersion.systemPrompt (falls gesetzt) */
  systemPromptOverride?: string;
}): { systemInstruction: string; userPrompt: string } {
  const tuning = params.tuning ?? mergeAlgorithmTuning({});
  const productsById = params.products?.length
    ? new Map<string, ProductRecommendationRow>(params.products.map((p) => [p.id, p]))
    : undefined;
  const listCtx: PrefilterBucketListContext = {
    productsById,
    calculations: params.calculations,
    tuning,
  };
  const productContext = buildProductContext(params.calculations, params.prefilter, listCtx);
  const promptFormat = buildPromptFormatBlock();
  const defaultUserPrompt = [productContext, "", promptFormat].join("\n");

  const admin = params.systemPromptOverride?.trim();
  const systemInstruction = admin
    ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\n--- Zusätzliche Vorgaben (Admin) ---\n${admin}`
    : DEFAULT_SYSTEM_INSTRUCTION;

  const tpl = params.userPromptTemplate?.trim();
  if (!tpl) {
    return { systemInstruction, userPrompt: defaultUserPrompt };
  }

  const known = [
    "{{PRODUCT_CONTEXT}}",
    "{{PROMPT_FORMAT}}",
    "{{REQUIREMENTS}}",
    "{{PRESELECTION}}",
  ] as const;
  const usesSubstitution = known.some((k) => tpl.includes(k));
  if (!usesSubstitution) {
    return { systemInstruction, userPrompt: tpl };
  }

  const requirements = buildRequirementsBlock(params.calculations);
  const preselection = formatPrefilterBuckets(params.prefilter, false, listCtx);
  const catalog =
    params.products && params.products.length > 0
      ? formatFullProductCatalog(params.products)
      : productContext;

  let userPrompt = tpl;
  const replacements: Record<(typeof known)[number], string> = {
    "{{PRODUCT_CONTEXT}}": catalog,
    "{{PROMPT_FORMAT}}": promptFormat,
    "{{REQUIREMENTS}}": requirements,
    "{{PRESELECTION}}": preselection,
  };
  for (const key of known) {
    if (userPrompt.includes(key)) {
      userPrompt = userPrompt.replaceAll(key, replacements[key]);
    }
  }

  return { systemInstruction, userPrompt };
}
