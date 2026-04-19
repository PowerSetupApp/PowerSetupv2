import { runAlgorithm } from "@/lib/results/run-algorithm";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

export type AlgorithmPreviewResult = {
  output: AlgorithmOutput;
  breakdown: AlgorithmOutput["breakdown"];
};

/**
 * Reproduziert den Live-Berechnungsweg des Admin-Algorithmus-Tests.
 *
 * Der neue Algorithmus ist eine reine Funktion mit hartkodierten Konstanten —
 * es wird NICHT mehr aus der `AlgorithmSettings`-Tabelle gemerged. Für die
 * Test-Ansicht wird `runAlgorithm(..., { explain: true })` verwendet, damit das
 * `breakdown`-Dict (Zwischenwerte der Phasen) mitgereicht werden kann.
 */
export function runAlgorithmPreview(input: AlgorithmInput): AlgorithmPreviewResult {
  const output = runAlgorithm(input, { explain: true });
  return { output, breakdown: output.breakdown };
}
