"use client";

import { useEffect, useMemo, useState } from "react";

import { mergeAlgorithmTuning } from "@/lib/algorithm/algorithm-tuning";
import { AUTARCHY_UNBOUNDED } from "@/lib/algorithm/constants";
import { autarchyMaxDays } from "@/lib/algorithm/derive";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

export type CanonicalPreviewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      rawBase: AlgorithmOutput;
      rawBatteryOnly: AlgorithmOutput;
      /** Input sent for `rawBase` (balance overrides cleared). */
      canonicalInput: AlgorithmInput;
    };

function clearedBalanceOverrides(input: AlgorithmInput): AlgorithmInput {
  return {
    ...input,
    customOverrides: {
      ...input.customOverrides,
      battery: null,
      solar: null,
    },
  };
}

/**
 * Strip `solar` from `energySources` for the battery-only preview.
 * Must clamp `autarchyDays` to the new profile's cap — otherwise
 * `validate()` fails (e.g. 7 days with solar+alternator is valid for
 * `weekend`, but 7 days with alternator-only exceeds `solar_or_alt`'s cap of 5).
 */
function withoutSolar(input: AlgorithmInput): AlgorithmInput {
  const cleared = clearedBalanceOverrides(input);
  const next: AlgorithmInput = {
    ...cleared,
    energySources: cleared.energySources.filter((e) => e !== "solar"),
  };
  if (next.autarchyDays === AUTARCHY_UNBOUNDED) return next;
  const maxNext = autarchyMaxDays(next, mergeAlgorithmTuning({}));
  if (next.autarchyDays <= maxNext) return next;
  return { ...next, autarchyDays: maxNext };
}

/**
 * Fetches algorithm preview with `battery`/`solar` overrides stripped, plus a
 * second preview with `solar` removed from `energySources` for the battery-only
 * extreme of the step-8 balance slider.
 */
export function useWizardStep8CanonicalPreviews(
  input: AlgorithmInput,
  enabled: boolean,
): CanonicalPreviewState {
  const canonical = useMemo(() => clearedBalanceOverrides(input), [input]);
  const canonicalSerialized = useMemo(() => JSON.stringify(canonical), [canonical]);
  const batteryOnlySerialized = useMemo(
    () => JSON.stringify(withoutSolar(input)),
    [input],
  );
  const hasSolar = input.energySources.includes("solar");

  const [state, setState] = useState<CanonicalPreviewState>({ kind: "idle" });

  useEffect(() => {
    if (!enabled) return;

    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ kind: "loading" });

    void (async () => {
      const formBase = JSON.parse(canonicalSerialized) as AlgorithmInput;
      try {
        const resBase = await fetch("/api/wizard/algorithm-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: formBase }),
          signal: ac.signal,
        });
        const bodyBase = (await resBase.json().catch(() => ({}))) as {
          error?: string;
          output?: AlgorithmOutput;
        };
        if (ac.signal.aborted) return;
        if (!resBase.ok) {
          setState({
            kind: "error",
            message: bodyBase.error ?? "Vorschau fehlgeschlagen",
          });
          return;
        }
        if (!bodyBase.output) {
          setState({ kind: "error", message: "Ungültige Server-Antwort" });
          return;
        }

        let rawBatteryOnly = bodyBase.output;
        if (hasSolar) {
          const formBat = JSON.parse(batteryOnlySerialized) as AlgorithmInput;
          const resBat = await fetch("/api/wizard/algorithm-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formData: formBat }),
            signal: ac.signal,
          });
          const bodyBat = (await resBat.json().catch(() => ({}))) as {
            error?: string;
            output?: AlgorithmOutput;
          };
          if (ac.signal.aborted) return;
          if (!resBat.ok || !bodyBat.output) {
            setState({
              kind: "error",
              message: bodyBat.error ?? "Vorschau (ohne Solar) fehlgeschlagen",
            });
            return;
          }
          rawBatteryOnly = bodyBat.output;
        }

        setState({
          kind: "ok",
          rawBase: bodyBase.output,
          rawBatteryOnly,
          canonicalInput: formBase,
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
  }, [batteryOnlySerialized, canonicalSerialized, enabled, hasSolar]);

  return enabled ? state : { kind: "idle" };
}
