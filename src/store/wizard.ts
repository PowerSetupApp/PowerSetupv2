"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AlgorithmInput } from "@/lib/algorithm/types";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";
import { algorithmInputSchema } from "@/lib/schemas/wizard-input";

/** DC-Verbraucher folgen der gewählten Bordspannung; 230-V-Wechselrichter-Last bleibt. */
function alignConsumersDcToSystem(input: AlgorithmInput): AlgorithmInput {
  return {
    ...input,
    consumers: input.consumers.map((c) =>
      c.voltage === 230 ? c : { ...c, voltage: input.systemVoltage },
    ),
  };
}

export type WizardStore = {
  input: AlgorithmInput;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
  setTravelBehavior: (patch: Partial<AlgorithmInput["travelBehavior"]>) => void;
  setCableLengths: (patch: Partial<AlgorithmInput["cableLengths"]>) => void;
  setBrandPreferences: (patch: Partial<AlgorithmInput["brandPreferences"]>) => void;
  reset: () => void;
};

/**
 * Restauriert einen persistierten Wizard-Input robust:
 *
 *   1. Leerer/fehlender Store  → Defaults.
 *   2. Fremdes Schema (z. B. alter Build) → Defaults (ohne Laufzeitfehler).
 *   3. Schema aktuell → Werte übernehmen.
 *
 * Das ersetzt den alten Shallow-Merge, der verschachtelte Objekte
 * (`travelBehavior`, `cableLengths` …) teilweise überschreiben konnte.
 */
function hydrateInput(persisted: unknown): AlgorithmInput {
  if (persisted == null || typeof persisted !== "object") return DEFAULT_ALGORITHM_INPUT;
  const p = persisted as Partial<Pick<WizardStore, "input">>;
  if (!p.input || typeof p.input !== "object") return DEFAULT_ALGORITHM_INPUT;

  const parsed = algorithmInputSchema.safeParse(p.input);
  if (parsed.success) return alignConsumersDcToSystem(parsed.data);
  return DEFAULT_ALGORITHM_INPUT;
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      input: DEFAULT_ALGORITHM_INPUT,
      patchInput: (patch) =>
        set((s) => {
          const prev = s.input;
          const next: AlgorithmInput = { ...prev, ...patch };
          if (
            patch.systemVoltage !== undefined &&
            patch.systemVoltage !== prev.systemVoltage
          ) {
            const sourceList = patch.consumers ?? next.consumers;
            next.consumers = sourceList.map((c) =>
              c.voltage === 230 ? c : { ...c, voltage: patch.systemVoltage! },
            );
          }
          return { input: next };
        }),
      setTravelBehavior: (patch) =>
        set((s) => ({
          input: {
            ...s.input,
            travelBehavior: { ...s.input.travelBehavior, ...patch },
          },
        })),
      setCableLengths: (patch) =>
        set((s) => ({
          input: {
            ...s.input,
            cableLengths: { ...s.input.cableLengths, ...patch },
          },
        })),
      setBrandPreferences: (patch) =>
        set((s) => ({
          input: {
            ...s.input,
            brandPreferences: { ...s.input.brandPreferences, ...patch },
          },
        })),
      reset: () => set({ input: DEFAULT_ALGORITHM_INPUT }),
    }),
    {
      name: "powersetup-wizard-v1",
      partialize: (state) => ({ input: state.input }),
      merge: (persisted, current) => ({
        ...current,
        input: hydrateInput(persisted),
      }),
    },
  ),
);
