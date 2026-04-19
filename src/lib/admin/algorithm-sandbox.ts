import {
  DEFAULT_CABLE_LENGTHS,
  type AlgorithmInput,
  type CableLengths,
} from "@/lib/algorithm/types";
import { CABLE_FIELD_META, snapCableLength } from "@/components/wizard/steps/step-6-cables/cable-meta";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/** Realistische Autarkie-Tage (kein „999 Maximum“ im Zufalls-Filter). */
const AUTARCHY_FILTER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10, 14] as const;

function randomCableLengths(): CableLengths {
  const keys = Object.keys(CABLE_FIELD_META) as (keyof CableLengths)[];
  const next: CableLengths = { ...DEFAULT_CABLE_LENGTHS };
  for (const key of keys) {
    const meta = CABLE_FIELD_META[key];
    const span = Math.round((meta.maxM - meta.minM) / meta.stepM);
    const k = randomInt(0, Math.max(0, span));
    const raw = meta.minM + k * meta.stepM;
    next[key] = snapCableLength(raw, meta.minM, meta.maxM, meta.stepM);
  }
  return next;
}

/**
 * Randomisiert nur „Randbedingungen“ (Reiseverhalten, Autarkie, Kabel, Lastprofil, Ladegeschwindigkeit, …).
 * Szenario-Basis bleibt: Bordnetz, Energiequellen, Dach/Solar-Taschen, Verbraucher, Batterietechnik, Marken, Overrides.
 */
export function randomizeAlgorithmTestFilters(base: AlgorithmInput): AlgorithmInput {
  return {
    ...base,
    chargerSpeed: pickOne(["slow", "normal", "fast"] as const),
    simultaneousLoad: pickOne(["low", "moderate", "high"] as const),
    travelBehavior: {
      season: pickOne(["summer", "all_year", "winter"] as const),
      tripDuration: pickOne(["weekend", "week", "extended", "permanent"] as const),
      winterLocation: pickOne(["scandinavia", "germany", "southern", "eastern", "varies"] as const),
      standingDuration: pickOne(["short", "medium", "long"] as const),
    },
    autarchyDays: pickOne(AUTARCHY_FILTER_OPTIONS),
    cableLengths: randomCableLengths(),
  };
}

export function stringifyAlgorithmInput(input: AlgorithmInput): string {
  return JSON.stringify(input, null, 2);
}
