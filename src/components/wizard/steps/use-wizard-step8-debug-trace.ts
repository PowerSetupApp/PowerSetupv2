"use client";

import { useEffect, useMemo, useState } from "react";

import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

/**
 * Debug variant of `useWizardStep8AlgorithmPreview`: hits the same API with
 * `debug: true` and exposes the Python-style `breakdown` dict (intermediate
 * quantities PSH, driveHours, dailyWh, …). The step-8 panel wires this
 * behind a toggle so the normal preview request stays lean.
 */

export type AlgorithmBreakdown = Record<string, number | string>;

export type WizardDebugBreakdownPayload = {
  wizardInput: AlgorithmInput;
  output: AlgorithmOutput;
  breakdown: AlgorithmBreakdown;
};

export type DebugTraceState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: WizardDebugBreakdownPayload };

export function useWizardStep8DebugTrace(
  input: AlgorithmInput,
  enabled: boolean,
): DebugTraceState {
  const serialized = useMemo(() => JSON.stringify(input), [input]);
  const [state, setState] = useState<DebugTraceState>({ kind: "idle" });

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
          body: JSON.stringify({ formData, debug: true }),
          signal: ac.signal,
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          wizardInput?: AlgorithmInput;
          output?: AlgorithmOutput;
          breakdown?: AlgorithmBreakdown;
        };
        if (ac.signal.aborted) return;
        if (!res.ok) {
          setState({
            kind: "error",
            message: body.error ?? "Debug-Ansicht fehlgeschlagen",
          });
          return;
        }
        if (!body.wizardInput || !body.output || !body.breakdown) {
          setState({
            kind: "error",
            message: "Ungültige Server-Antwort (Breakdown fehlt)",
          });
          return;
        }
        setState({
          kind: "ok",
          data: {
            wizardInput: body.wizardInput,
            output: body.output,
            breakdown: body.breakdown,
          },
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
