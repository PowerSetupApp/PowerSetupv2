"use client";

import { useEffect, useMemo, useState } from "react";

import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

export type WizardAlgorithmPreviewPayload = {
  wizardInput: AlgorithmInput;
  output: AlgorithmOutput;
};

export type PreviewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: WizardAlgorithmPreviewPayload };

/**
 * Wizard-Step-8 live preview. Posts the serialized wizard state to
 * `/api/wizard/algorithm-preview` and exposes the resulting
 * `AlgorithmOutput`. Debug info (intermediate numbers) is fetched by the
 * sibling hook `useWizardStep8DebugTrace` on demand.
 */
export function useWizardStep8AlgorithmPreview(
  input: AlgorithmInput,
  enabled: boolean,
): PreviewState {
  const serialized = useMemo(() => JSON.stringify(input), [input]);
  const [state, setState] = useState<PreviewState>({ kind: "idle" });

  useEffect(() => {
    if (!enabled) return;

    const ac = new AbortController();
    // Data-fetching pattern: flag the loading phase so the UI can show a
    // spinner immediately. Later `setState` calls happen from async
    // callbacks (not synchronously in the effect body).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ kind: "loading" });

    void (async () => {
      const formData = JSON.parse(serialized) as AlgorithmInput;
      try {
        const res = await fetch("/api/wizard/algorithm-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData }),
          signal: ac.signal,
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          wizardInput?: AlgorithmInput;
          output?: AlgorithmOutput;
        };
        if (ac.signal.aborted) return;
        if (!res.ok) {
          setState({
            kind: "error",
            message: body.error ?? "Vorschau fehlgeschlagen",
          });
          return;
        }
        if (!body.wizardInput || !body.output) {
          setState({ kind: "error", message: "Ungültige Server-Antwort" });
          return;
        }
        setState({
          kind: "ok",
          data: { wizardInput: body.wizardInput, output: body.output },
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Netzwerkfehler",
        });
      }
    })();

    return () => ac.abort();
  }, [enabled, serialized]);

  // Derive the idle state when disabled so we don't need a setState() inside
  // the effect body (react-hooks/set-state-in-effect).
  return enabled ? state : { kind: "idle" };
}
