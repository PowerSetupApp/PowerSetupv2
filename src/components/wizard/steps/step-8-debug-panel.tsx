"use client";

import { Loader2 } from "lucide-react";

import type { DebugTraceState } from "./use-wizard-step8-debug-trace";

/**
 * Wizard-Step-8 "Debug" view.
 *
 * The new algorithm (1:1 port of
 * `docs/reference/algorithm/camper_electrics_sizing.py`) exposes its
 * intermediates through an opt-in `breakdown` dictionary (the Python
 * `explain=True` mode). This panel renders that dictionary as a plain
 * key/value table. No more mermaid flowchart, no more DB-provenance badges —
 * constants are hard-coded in `src/lib/algorithm/constants.ts` so there is
 * nothing to colour-code.
 */

interface Step8DebugPanelProps {
  /** Wizard must be submittable before the preview can be requested. */
  canSubmit: boolean;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  state: DebugTraceState;
  /** When true (e.g. inside the step-8 debug modal), the checkbox is hidden — parent controls fetching. */
  hideToggle?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  driveHoursPerDay: "Fahrstunden pro Tag",
  shoreAvailability: "Landstrom-Verfügbarkeit",
  peakFactor: "Gleichzeitigkeits-/Spitzenfaktor",
  psh: "Peak Sun Hours",
  dcWh: "DC-Verbrauch",
  acWh: "AC-Verbrauch (vor Wechselrichter)",
  peakAcW: "AC-Spitzenlast",
  peakDcW: "DC-Spitzenlast",
  inverterStandbyWh: "Wechselrichter-Standby",
  dailyWh: "Täglicher Gesamtbedarf",
  effectiveAutarchyDays: "Effektive Autarkie-Tage",
  maxAutarchyDaysForTrip: "Max. Autarkie (Reiseart)",
  alternatorLimitA: "Alternator-Limit (Dauerstrom)",
  dod: "DoD (Entladetiefe)",
  roundtripEfficiency: "Roundtrip-Wirkungsgrad",
  chemCRateMax: "Max. C-Rate (Chemie)",
  absorptionTailH: "Absorption-Tail",
  shoreBridgeReliefBaseDays: "Landstrom-Relief (Basis, Tage)",
  shoreBridgeReliefEffectiveDays: "Landstrom-Relief (effektiv, Tage)",
  shoreReliefAlternatorScale: "Landstrom-Relief × Ladebooster-Skalierung",
  autarchyBridgeDaysRaw: "Brückentage (roh, vor Relief)",
  autarchyBridgeDaysForSoft: "Brückentage (weiche Brücke)",
  shoreBatteryReliefAutarchyThreshold: "Autarkie-Schwelle Landstrom-Relief",
};

const FIELD_UNITS: Record<string, string> = {
  driveHoursPerDay: "h/Tag",
  peakFactor: "×",
  psh: "h/Tag",
  dcWh: "Wh/Tag",
  acWh: "Wh/Tag",
  peakAcW: "W",
  peakDcW: "W",
  inverterStandbyWh: "Wh/Tag",
  dailyWh: "Wh/Tag",
  effectiveAutarchyDays: "Tage",
  maxAutarchyDaysForTrip: "Tage",
  alternatorLimitA: "A",
  absorptionTailH: "h",
  shoreBridgeReliefBaseDays: "Tage",
  shoreBridgeReliefEffectiveDays: "Tage",
  shoreReliefAlternatorScale: "×",
  autarchyBridgeDaysRaw: "Tage",
  autarchyBridgeDaysForSoft: "Tage",
  shoreBatteryReliefAutarchyThreshold: "Tage",
};

function formatEntry(key: string, value: number | string): string {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "—";
  // Whole numbers stay whole; fractions get up to 4 decimals.
  const rounded =
    Math.abs(value - Math.round(value)) < 1e-9
      ? value.toFixed(0)
      : value.toFixed(4).replace(/\.?0+$/, "");
  const unit = FIELD_UNITS[key];
  return unit ? `${rounded} ${unit}` : rounded;
}

export function Step8DebugPanel({
  canSubmit,
  enabled,
  onToggle,
  state,
  hideToggle = false,
}: Step8DebugPanelProps) {
  const breakdown = state.kind === "ok" ? state.data.breakdown : null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-muted/5 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Debug-Ansicht
          </h3>
          <p className="text-xs text-muted-foreground">
            Zeigt die Zwischenwerte des Algorithmus (PSH, Fahrstunden,
            Tagesverbrauch …) für die aktuellen Wizard-Eingaben.
          </p>
        </div>
        {!hideToggle ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="size-4 rounded border-border"
              disabled={!canSubmit}
            />
            <span>Zwischenwerte anzeigen</span>
          </label>
        ) : null}
      </header>

      {!canSubmit ? (
        <p className="text-xs text-muted-foreground">
          Bitte zuerst alle Pflichtschritte ausfüllen.
        </p>
      ) : !enabled ? (
        <p className="text-xs text-muted-foreground">
          {hideToggle
            ? "Zwischenwerte werden geladen …"
            : "Aktiviere die Debug-Ansicht, um die Zwischenwerte zu laden."}
        </p>
      ) : state.kind === "loading" ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Lade
          Zwischenwerte …
        </p>
      ) : state.kind === "error" ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : breakdown ? (
        <div className="overflow-x-auto rounded-md border border-border/60 bg-background">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="p-2 text-left font-medium">Kennzahl</th>
                <th className="p-2 text-right font-medium">Wert</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(breakdown).map(([key, value]) => (
                <tr
                  key={key}
                  className="border-t border-border/30 last:border-0"
                >
                  <td className="p-2 font-mono text-foreground">
                    {FIELD_LABELS[key] ?? key}
                  </td>
                  <td className="p-2 text-right font-mono tabular-nums text-foreground">
                    {formatEntry(key, value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default Step8DebugPanel;
