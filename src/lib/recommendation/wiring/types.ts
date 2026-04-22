export type SolarWiringRationale = "alle-reihe" | "alle-parallel" | "mischung" | "kein-feasible";

export type SolarWiringWarning =
  | { kind: "mppt-voltage-exceeded"; required: number; available: number }
  | { kind: "module-count-not-divisible"; suggested: number }
  | { kind: "parallel-current-high"; currentA: number; cableMm2: number };

export type SolarWiringRecommendation = {
  seriesCount: number;
  parallelCount: number;
  totalModules: number;
  arrayVoltageVmppV: number;
  arrayVoltageVocColdV: number;
  arrayCurrentImppA: number;
  mpptMaxInputV: number;
  rationale: SolarWiringRationale;
  warnings: SolarWiringWarning[];
  description: string;
};
