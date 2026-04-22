import type { AlgorithmOutput } from "@/lib/algorithm/types";

import type { PrefilterResult, ProductRecommendationRow } from "@/lib/recommendation/types";

function summarizeCalculations(calc: AlgorithmOutput): string {
  return [
    `Batterie: ${calc.battery.recommendedCapacityAh} Ah @ ${calc.battery.voltage} V (${calc.battery.type})`,
    `Solar nötig: ${calc.solar.needed} — Ziel ca. ${calc.solar.requiredWp} Wp, verfügbar ${calc.solar.totalAvailableWp} Wp`,
    `Wechselrichter nötig: ${calc.inverter.needed} — empfohlen ca. ${calc.inverter.recommendedW} W`,
    `Solarregler nötig: ${calc.controller.needed} — empfohlen ca. ${calc.controller.currentA} A`,
  ].join("\n");
}

function formatPrefilterBuckets(pref: PrefilterResult, includeRules = true): string {
  const lines: string[] = [];
  if (includeRules) {
    lines.push(
      "Wichtig: Verwende ausschließlich die folgenden productId-Werte — keine anderen IDs erfinden.",
      "Anforderungen: Batterie-Kapazität ≥ Ziel-Ah (siehe Kurzfassung). Solar: Gesamtleistung (Modulanzahl × Wp) ≥ requiredWp.",
      "Mehrere Kabel-Einträge wählen für unterschiedliche Leitungspfade, wenn unter „Kabel pro Strecke“ gelistet.",
      "Mehrere Sicherungen aus „Sonstiges“ möglich, wenn passende Stromwerte gelistet sind.",
    );
  }
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
  "Antworte ausschließlich mit gültigem JSON (Root-Objekt, siehe Schema) — kein Markdown, kein Code-Block, kein Fließtext davor oder danach.",
].join(" ");

function buildProductContext(calculations: AlgorithmOutput, prefilter: PrefilterResult): string {
  return [
    "## Berechnungs-Kurzfassung",
    summarizeCalculations(calculations),
    "",
    "## Vorgefilterte Kandidaten (nur diese productId verwenden)",
    formatPrefilterBuckets(prefilter, true),
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
  /** Aus Admin „KI & Modelle“ → Prompt: Empfehlungen */
  userPromptTemplate?: string;
  /** Aktiver PromptVersion.systemPrompt (falls gesetzt) */
  systemPromptOverride?: string;
}): { systemInstruction: string; userPrompt: string } {
  const productContext = buildProductContext(params.calculations, params.prefilter);
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
  const preselection = formatPrefilterBuckets(params.prefilter, false);
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
