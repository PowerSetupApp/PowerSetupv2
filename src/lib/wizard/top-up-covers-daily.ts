import { computeAlgorithm } from "@/lib/algorithm";
import type { AlgorithmInput } from "@/lib/algorithm/types";

/**
 * True when estimated solar + alternator top-up already meets or exceeds daily
 * demand — then autarky-day slider mostly affects the soft bridge, not the
 * visible Ah (hard 1-day floor may bind).
 */
export function topUpCoversDailyWh(input: AlgorithmInput): boolean | null {
  try {
    const out = computeAlgorithm(input);
    return out.battery.dailyTopUpWh >= out.battery.dailyWh;
  } catch {
    return null;
  }
}
