"use client";

import { useMemo } from "react";

import type { DebugTraceState } from "@/components/wizard/steps/use-wizard-step8-debug-trace";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

const EXPORT_NOTE =
  "PowerSetup Wizard — Schritt 8: identischer Algorithmus-Pfad wie /api/generate (computeAlgorithm + applyCustomOverrides), ohne Produkt-Prefilter/KI.";

export type Step8PreviewStatus = "idle" | "loading" | "error";

/** Serializes wizard input + displayed algorithm output for copy/paste debugging. */
export function useStep8ExportJson(
  wizardInput: AlgorithmInput,
  output: AlgorithmOutput | null,
  previewStatus: Step8PreviewStatus,
  previewError?: string,
  debugState?: DebugTraceState,
) {
  return useMemo(() => {
    const exportedAt = new Date().toISOString();
    const breakdown =
      debugState?.kind === "ok" ? debugState.data.breakdown : null;
    if (output == null) {
      return JSON.stringify(
        {
          exportedAt,
          note: EXPORT_NOTE,
          wizardInput,
          output: null,
          previewStatus,
          ...(previewStatus === "error" && previewError
            ? { previewError }
            : {}),
          ...(breakdown ? { breakdown } : {}),
        },
        null,
        2,
      );
    }
    return JSON.stringify(
      {
        exportedAt,
        note: EXPORT_NOTE,
        wizardInput,
        output,
        ...(breakdown ? { breakdown } : {}),
      },
      null,
      2,
    );
  }, [wizardInput, output, previewStatus, previewError, debugState]);
}
