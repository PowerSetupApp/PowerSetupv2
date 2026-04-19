/**
 * Algorithm Trace
 *
 * Optional Side-Channel, der während `calculateRequirements()` mitgeschrieben
 * werden kann. Erlaubt der Debug-Ansicht in Step 8:
 *
 * 1. Konstanten-Provenance anzeigen (DB vs. Input-Override vs. hart kodierter Fallback).
 * 2. Zwischenwerte und Formeln mit eingesetzten realen Zahlen zu rendern.
 * 3. Sanity-Check-Warnungen auszugeben.
 *
 * Die Kern-Rechnung bleibt unberührt: Wenn kein `trace` mitgegeben wird,
 * verhält sich der Algorithmus exakt wie vorher (Null-Kosten-Instrumentierung).
 */
import type { AlgorithmInput, AlgorithmSettingsData } from "./types";

/** Herkunft eines aufgelösten Setting-Wertes. */
export type TraceConstantSource = "db" | "input-override" | "fallback";

/** Eine Zeile in der Konstanten-Tabelle. */
export interface TraceConstant {
  /** Phase, in der der Wert abgefragt wurde. */
  phase: TracePhase;
  /** Name der Konstante (siehe `AlgorithmSettingsData`). */
  key: keyof AlgorithmSettingsData;
  /** Tatsächlich verwendeter Wert. */
  value: number;
  /** Hart kodierter Fallback-Wert aus `constants.ts`. */
  fallback: number;
  /** DB-Wert (wenn aus dem Row bekannt). */
  dbValue?: number;
  /** Herkunft des tatsächlichen Wertes. */
  source: TraceConstantSource;
}

/** Ein einzelner Berechnungs-Schritt (Eingabe, Zwischenwert, Ausgabe). */
export interface TraceStep {
  phase: TracePhase;
  /** Eindeutige ID im Fluss, z. B. "energy.dailyWh". */
  id: string;
  /** Menschlicher Titel. */
  label: string;
  /** Hauptwert. */
  value: number;
  /** Einheit (Wh, Ah, A, Wp …) für die UI. */
  unit?: string;
  /** Art des Schrittes für die UI-Gruppierung. */
  kind: "input" | "intermediate" | "output";
  /** Optionale lesbare Formel (bevorzugt mit eingesetzten Zahlen). */
  formula?: string;
  /** Freitext-Anmerkung. */
  note?: string;
}

export interface TraceWarning {
  phase: TracePhase;
  /** Kurze Kennung, z. B. "battery.oversized". */
  code: string;
  severity: "info" | "warn";
  message: string;
}

export type TracePhase =
  | "input"
  | "energy"
  | "solar"
  | "battery"
  | "booster"
  | "charger"
  | "inverter"
  | "controller"
  | "cables";

/** Zusätzliche Meta-Infos über das zugrunde liegende DB-Setting-Row. */
export interface TraceMeta {
  /** Gab es überhaupt eine `AlgorithmSettings`-Zeile in der DB? */
  hasDbRow?: boolean;
  /** ISO-Zeitpunkt des letzten DB-Updates, rein informativ für die UI. */
  dbUpdatedAt?: string;
}

export interface AlgorithmTrace {
  meta: TraceMeta;
  constants: TraceConstant[];
  steps: TraceStep[];
  warnings: TraceWarning[];
  /**
   * Snapshot der normalisierten DB-Werte (aus `AlgorithmSettings`).
   * Wird vom Adapter gesetzt; für die Provenance-Erkennung in `tracedGetSetting`.
   */
  dbSettings?: AlgorithmSettingsData;
  /**
   * Snapshot der Input-Overrides (z. B. aus Tests), so wie sie vor dem
   * Merge mit DB-Settings am Input hingen.
   */
  inputOverrides?: AlgorithmSettingsData;
}

export function createTrace(meta: TraceMeta = {}): AlgorithmTrace {
  return {
    meta: { ...meta },
    constants: [],
    steps: [],
    warnings: [],
  };
}

/**
 * Traced `getSetting`: schreibt Provenance-Information in den Trace.
 *
 * Priorität beim Aufruf entspricht der bestehenden Semantik:
 * - Ist `input.settings[key]` eine endliche Zahl, wird dieser Wert verwendet.
 * - Andernfalls `fallback`.
 *
 * Die Quelle (`source`) ergibt sich aus den im Trace hinterlegten Snapshots:
 * - `input-override` wenn der Wert im `inputOverrides`-Snapshot steht
 * - `db` wenn er im `dbSettings`-Snapshot steht
 * - `fallback` wenn weder DB noch Override ihn liefern
 *
 * Ohne `trace` arbeitet die Funktion wie der frühere `getSetting`.
 */
export function tracedGetSetting<K extends keyof AlgorithmSettingsData>(
  input: AlgorithmInput,
  key: K,
  fallback: number,
  phase: TracePhase,
  trace?: AlgorithmTrace,
): number {
  const val = input.settings?.[key];
  const hasValid = typeof val === "number" && Number.isFinite(val);
  const finalValue = hasValid ? (val as number) : fallback;

  if (!trace) return finalValue;

  const overrideVal = trace.inputOverrides?.[key];
  const dbVal = trace.dbSettings?.[key];

  let source: TraceConstantSource;
  if (!hasValid) {
    source = "fallback";
  } else if (typeof overrideVal === "number" && Number.isFinite(overrideVal)) {
    source = "input-override";
  } else if (typeof dbVal === "number" && Number.isFinite(dbVal)) {
    source = "db";
  } else {
    source = "input-override";
  }

  const alreadyRecorded = trace.constants.some(
    (c) => c.phase === phase && c.key === key,
  );
  if (!alreadyRecorded) {
    trace.constants.push({
      phase,
      key,
      value: finalValue,
      fallback,
      dbValue: typeof dbVal === "number" && Number.isFinite(dbVal) ? dbVal : undefined,
      source,
    });
  }

  return finalValue;
}

/** Schreibt einen Berechnungs-Schritt in den Trace (no-op ohne `trace`). */
export function pushStep(trace: AlgorithmTrace | undefined, step: TraceStep): void {
  if (!trace) return;
  trace.steps.push(step);
}

export function pushWarning(
  trace: AlgorithmTrace | undefined,
  warning: TraceWarning,
): void {
  if (!trace) return;
  trace.warnings.push(warning);
}

/** Hilfsfunktion: rundet Zahl auf N Dezimalstellen (nur fürs Rendering). */
export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
