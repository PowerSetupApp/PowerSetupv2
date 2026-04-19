import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type { SchematicVariant } from "@/generated/prisma/client";

import type { SchematicProductBrief } from "@/lib/schematic/product-brief";

export function buildSchematicPrompt(params: {
  variant: SchematicVariant;
  calculations: AlgorithmOutput;
  products: SchematicProductBrief[];
  formSummaryDe: string;
}): { systemInstruction: string; userPrompt: string } {
  const variantHint =
    params.variant === "beginner"
      ? "Zielgruppe: Einsteiger — sehr klare Blöcke, wenig Fachjargon in Beschriftungen, Aufzählung wichtiger Sicherheitshinweise."
      : "Zielgruppe: Profi — präzise technische Bezeichnungen, sinnvolle Reihenfolge (Quelle → Schutz → Verbraucher).";

  const systemInstruction = [
    "Du bist ein deutscher Elektrofachplaner für mobile 12/24V-Bordnetze (Wohnmobil/Boot).",
    "Erzeuge AUSSCHLIESSLICH gültiges JSON gemäß dem vorgegebenen Schema (kein Markdown, keine Codefences).",
    "Nutze nur die gelieferten Produktdaten und Berechnungswerte; erfinde keine zusätzlichen Geräte-Modelle.",
    "Knoten-IDs: kurz, eindeutig, nur Buchstaben/Ziffern/Unterstrich.",
    "Kanten: logische Strompfade (Plus/Minus getrennt modellieren, wo sinnvoll).",
    "warningsDe: immer mindestens einen Hinweis zu Messung/Fachbetrieb/Fehlersuche; keine Garantie für Normenkonformität vor Ort.",
    variantHint,
  ].join(" ");

  const calcJson = JSON.stringify(params.calculations, null, 0);
  const prodJson = JSON.stringify(params.products, null, 0);

  const userPrompt = [
    "Formular-Kurzfassung (Deutsch):",
    params.formSummaryDe,
    "",
    "Algorithmus-Ausgabe (JSON):",
    calcJson,
    "",
    "Ausgewählte Produkte (Kurzliste, JSON):",
    prodJson,
    "",
    "JSON-Schema (Felder exakt so benennen):",
    '{ "title": string, "legendDe": string, "warningsDe": string[],',
    '  "nodes": { "id": string, "label": string, "componentType": string, "notesDe"?: string }[],',
    '  "edges": { "from": string, "to": string, "label"?: string }[] }',
    "",
    "Anforderungen:",
    "- mindestens 4 Knoten (z. B. Batterie, Sicherung/Hauptschalter, Verteilung, Verbrauchergruppe).",
    "- edges müssen nur auf existierende node.id verweisen.",
  ].join("\n");

  return { systemInstruction, userPrompt };
}
