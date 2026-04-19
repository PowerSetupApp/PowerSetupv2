import type { AlgorithmInput, AlgorithmSettingsData } from "../types";
import { tracedGetSetting, type AlgorithmTrace, type TracePhase } from "../trace";

/**
 * Setting-Zugriff mit Fallback auf hart kodierte Konstante.
 *
 * Typsicher: nur `number`-Settings sind erlaubt (`AlgorithmSettingsData`
 * enthält ausschließlich numerische Felder). Damit kein `as unknown as T`
 * mehr, der Typ-Mismatches stumm schluckt.
 *
 * Bei übergebenem `trace` wird zusätzlich die Provenance (DB vs. Override
 * vs. Fallback) in den Trace geschrieben. Ohne Trace verhält sich die
 * Funktion exakt wie die frühere implementierung.
 */
export function getSetting<K extends keyof AlgorithmSettingsData>(
  input: AlgorithmInput,
  key: K,
  fallback: number,
  phase: TracePhase = "input",
  trace?: AlgorithmTrace,
): number {
  return tracedGetSetting(input, key, fallback, phase, trace);
}
