import * as z from "zod";

import { algorithmSettingsToComputeOptions } from "@/lib/algorithm/options-from-db";
import { getAlgorithmSettingsCached } from "@/lib/db/queries/admin-settings-algorithm";
import { runRecommendationPipeline } from "@/lib/recommendation";
import { runAlgorithm } from "@/lib/results/run-algorithm";
import { createWizardResultBodySchema } from "@/lib/schemas/wizard-input";

/**
 * Wizard Step 8: Prefilter + PV-Verschaltung (ohne KI), für Live-Hinweise
 * unter der Algorithmus-Vorschau.
 */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { formData } = createWizardResultBodySchema.parse(json);
    const algoRow = await getAlgorithmSettingsCached();
    const tuning = algorithmSettingsToComputeOptions(algoRow);
    const calculations = runAlgorithm(formData, tuning);
    const pipeline = await runRecommendationPipeline({
      calculations,
      runAi: false,
      tuningOverrides: tuning,
    });
    return Response.json({ wiring: pipeline.wiring ?? null });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/wizard/recommendation-preview]", e);
    }
    return Response.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
