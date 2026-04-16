"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AlgorithmInput } from "@/lib/algorithm/types";
import { DEFAULT_ALGORITHM_INPUT } from "@/lib/algorithm/types";

export type WizardStore = {
  input: AlgorithmInput;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
  setTravelBehavior: (patch: Partial<AlgorithmInput["travelBehavior"]>) => void;
  setCableLengths: (patch: Partial<AlgorithmInput["cableLengths"]>) => void;
  setBrandPreferences: (patch: Partial<AlgorithmInput["brandPreferences"]>) => void;
  reset: () => void;
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      input: DEFAULT_ALGORITHM_INPUT,
      patchInput: (patch) =>
        set((s) => ({
          input: { ...s.input, ...patch },
        })),
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
    },
  ),
);
