import * as z from "zod";

import { runAlgorithm } from "@/lib/results/run-algorithm";
import { createWizardResultBodySchema } from "@/lib/schemas/wizard-input";

/**
 * Wizard-Step-8 Live-Vorschau. Ruft den neuen `computeAlgorithm`-Pfad direkt
 * auf (ohne DB-Settings-Merge, ohne Trace/Mermaid).
 *
 * Request:   `{ formData: AlgorithmInput, debug?: boolean }`
 * Response:  `{ wizardInput, output }` (+ `breakdown` wenn `debug === true`).
 *
 * Das `breakdown` enthält die Zwischenwerte aus dem Python-`explain=True`
 * Modus (PSH, driveHours, dailyWh, …) und ersetzt den alten `AlgorithmTrace`
 * als Debug-Darstellung.
 */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const { formData, debug } = createWizardResultBodySchema.parse(json);
    const output = runAlgorithm(formData, { explain: debug === true });

    // Lift `breakdown` to a top-level field for a clean output shape.
    const { breakdown, ...cleanOutput } = output;
    return Response.json({
      wizardInput: formData,
      output: cleanOutput,
      ...(breakdown ? { breakdown } : {}),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Ungültige Eingaben" }, { status: 400 });
    }
    if (process.env.NODE_ENV !== "test") {
      console.error("[api/wizard/algorithm-preview]", e);
    }
    return Response.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
