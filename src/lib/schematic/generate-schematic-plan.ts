import type { AlgorithmOutput } from "@/lib/algorithm/types";
import type { SchematicVariant } from "@/generated/prisma/client";

import { callAI } from "@/lib/ai/client";
import { buildSchematicPrompt } from "@/lib/ai/prompts/schematic";

import { buildFormSummaryDe } from "./form-summary";
import type { SchematicProductBrief } from "./product-brief";
import { assertSchematicGraphValid, schematicPlanSchema, type SchematicPlan } from "./schema";

function isMockSchematic(): boolean {
  const v = process.env.USE_MOCK_SCHEMATIC?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function isMockAiEnv(): boolean {
  const v = process.env.USE_MOCK_AI?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function mockPlan(): SchematicPlan {
  return schematicPlanSchema.parse({
    title: "Bordnetz-Übersicht (Mock)",
    legendDe: "Demonstrations-Schaltplan für Tests ohne KI.",
    warningsDe: [
      "Dies ist ein Platzhalter — vor Inbetriebnahme immer Fachbetrieb hinzuziehen.",
      "Normen und örtliche Vorschriften sind einzuhalten.",
    ],
    nodes: [
      { id: "BAT", label: "Servicebatterie", componentType: "battery" },
      { id: "FUSE", label: "Hauptsicherung / Trennung", componentType: "protection" },
      { id: "BUS", label: "DC-Verteilung", componentType: "distribution" },
      { id: "LOAD", label: "Verbraucher", componentType: "loads" },
    ],
    edges: [
      { from: "BAT", to: "FUSE", label: "+" },
      { from: "FUSE", to: "BUS" },
      { from: "BUS", to: "LOAD" },
    ],
  });
}

export async function generateSchematicPlanFromContext(params: {
  variant: SchematicVariant;
  formData: unknown;
  calculations: AlgorithmOutput;
  products: SchematicProductBrief[];
}): Promise<SchematicPlan> {
  if (isMockSchematic() || isMockAiEnv()) {
    return mockPlan();
  }

  const formSummaryDe = buildFormSummaryDe(params.formData);
  const { systemInstruction, userPrompt } = buildSchematicPrompt({
    variant: params.variant,
    calculations: params.calculations,
    products: params.products,
    formSummaryDe,
  });

  const res = await callAI({
    systemInstruction,
    userPrompt,
    responseMimeType: "application/json",
  });

  const raw = JSON.parse(res.text) as unknown;
  const plan = schematicPlanSchema.parse(raw);
  assertSchematicGraphValid(plan);
  return plan;
}
