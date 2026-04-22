import {
  getResultByIdForPublic,
  markGenerationFailed,
  tryClaimGenerationSlot,
  updateResultAfterGeneration,
} from "@/lib/db/queries/results";
import { AIInvocationError } from "@/lib/ai/types";
import { algorithmSettingsToComputeOptions } from "@/lib/algorithm/options-from-db";
import { getAlgorithmSettingsCached } from "@/lib/db/queries/admin-settings-algorithm";
import { runRecommendationPipeline } from "@/lib/recommendation";
import { runAlgorithm } from "@/lib/results/run-algorithm";
import { parseAlgorithmInput } from "@/lib/schemas/wizard-input";

import { isResultExpired } from "./result-helpers";

export class GenerateResultError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GenerateResultError";
  }
}

export type GenerateOutcome =
  | { status: "succeeded" }
  | { status: "pending" }
  | { status: "already-pending" };

/**
 * Idempotente Result-Generierung mit atomarem Lock.
 *
 * Ablauf:
 *   1. `tryClaimGenerationSlot` setzt `idle|failed|stale-pending → pending`
 *      in einem einzelnen `UPDATE … WHERE …`. Nur der Aufrufer, der `claimed`
 *      bekommt, darf die AI-Pipeline ausführen.
 *   2. Alle anderen bekommen den aktuellen Status zurückgemeldet —
 *      `succeeded` (Ergebnis fertig), `pending` (anderer Prozess rechnet).
 *   3. Fehler landen in `generationError`; der Client kann via `failed →
 *      pending`-Übergang einen sauberen Retry auslösen.
 */
export async function runGenerateForResultId(id: string): Promise<GenerateOutcome> {
  const claim = await tryClaimGenerationSlot(id);
  if (!claim.claimed) {
    if (!(await existsResult(id))) {
      throw new GenerateResultError(404, "Result nicht gefunden");
    }
    if (claim.expired) {
      throw new GenerateResultError(410, "Dieses Ergebnis ist abgelaufen");
    }
    if (claim.status === "succeeded") return { status: "succeeded" };
    return { status: "already-pending" };
  }

  try {
    const row = await getResultByIdForPublic(id);
    if (!row) throw new GenerateResultError(404, "Result nicht gefunden");
    if (isResultExpired(row.expiresAt)) {
      await markGenerationFailed(id, "Dieses Ergebnis ist abgelaufen");
      throw new GenerateResultError(410, "Dieses Ergebnis ist abgelaufen");
    }

    const rawInput = parseInput(row.formData);
    const algoRow = await getAlgorithmSettingsCached();
    const algoOpts = algorithmSettingsToComputeOptions(algoRow);
    let calculations: ReturnType<typeof runAlgorithm>;
    try {
      calculations = runAlgorithm(rawInput, algoOpts);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Die Berechnung ist mit diesen gespeicherten Eingaben fehlgeschlagen.";
      throw new GenerateResultError(500, msg);
    }
    const pipeline = await runRecommendationPipeline({ calculations, runAi: true });

    await updateResultAfterGeneration({
      id,
      calculations,
      recommendations: {
        prefilter: pipeline.prefilter,
        ai: pipeline.ai
          ? {
              selections: pipeline.ai.selections,
              model: pipeline.ai.model,
              inputTokens: pipeline.ai.inputTokens,
              outputTokens: pipeline.ai.outputTokens,
            }
          : undefined,
      },
      aiModel: pipeline.ai?.model ?? null,
      inputTokens: pipeline.ai?.inputTokens ?? null,
      outputTokens: pipeline.ai?.outputTokens ?? null,
    });

    return { status: "succeeded" };
  } catch (e) {
    await markGenerationFailed(id, extractFailureMessage(e));
    if (e instanceof GenerateResultError) throw e;
    if (e instanceof AIInvocationError) {
      throw new GenerateResultError(502, e.message);
    }
    console.error("[runGenerateForResultId] unexpected failure", e);
    throw new GenerateResultError(500, "Interner Berechnungsfehler");
  }
}

async function existsResult(id: string): Promise<boolean> {
  const row = await getResultByIdForPublic(id);
  return row !== null;
}

function parseInput(formData: unknown): ReturnType<typeof parseAlgorithmInput> {
  try {
    return parseAlgorithmInput(formData);
  } catch {
    throw new GenerateResultError(500, "Gespeicherte Eingaben sind ungültig");
  }
}

function extractFailureMessage(e: unknown): string {
  if (e instanceof AIInvocationError) return e.message;
  if (e instanceof GenerateResultError) return e.message;
  if (e instanceof Error) return e.message;
  return "Unbekannter Fehler";
}
