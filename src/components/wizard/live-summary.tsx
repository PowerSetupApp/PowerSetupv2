"use client";

import { ProgressRing } from "@/components/ui/progress-ring";
import { ProductIllo } from "@/components/ui/product-illo";
import { Stat } from "@/components/ui/stat";
import { useLiveSummaryPreview } from "@/components/wizard/use-live-summary-preview";
import {
  BATTERY_CARDS,
  SYSTEM_CARDS,
  VEHICLE_CARDS,
} from "@/components/wizard/steps/step-1-basics/basics-options";
import type { AlgorithmInput, EnergySource } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

const ENERGY_SOURCE_LABELS: Record<EnergySource, string> = {
  solar: "Solar",
  alternator: "Lichtmaschine / Booster",
  shore_power: "Landstrom 230 V",
};

function roofModuleLabel(roofModuleType: AlgorithmInput["roofModuleType"]): string {
  return roofModuleType === "rigid" ? "Starr" : "Flexibel";
}

type RowKey =
  | "vehicle"
  | "chem"
  | "energy"
  | "roof"
  | "consumers"
  | "travel"
  | "autarky"
  | "cables";

const ROWS: { key: RowKey; label: string }[] = [
  { key: "vehicle", label: "Fahrzeug & Basis" },
  { key: "chem", label: "System · Chemie" },
  { key: "energy", label: "Energiequellen" },
  { key: "roof", label: "Dachfläche" },
  { key: "consumers", label: "Verbraucher" },
  { key: "travel", label: "Reisestil" },
  { key: "autarky", label: "Autarkie" },
  { key: "cables", label: "Kabel" },
];

function rowDone(step: number, key: RowKey): boolean {
  switch (key) {
    case "vehicle":
      return step >= 1;
    case "chem":
      return step >= 1;
    case "energy":
      return step >= 2;
    case "roof":
      return step >= 2;
    case "consumers":
      return step >= 3;
    case "travel":
      return step >= 4;
    case "autarky":
      return step >= 5;
    case "cables":
      return step >= 6;
    default:
      return false;
  }
}

export interface LiveSummaryProps {
  step: number;
  input: AlgorithmInput;
  /** Algorithmus-Vorschau ab Schritt 3 (wenn API gültige Eingaben akzeptiert). */
  previewFromStep?: number;
  className?: string;
}

export function LiveSummary({
  step,
  input,
  previewFromStep = 3,
  className,
}: LiveSummaryProps) {
  const enabled = step >= previewFromStep;
  const { output, loading } = useLiveSummaryPreview(input, enabled);

  const batAh = output?.battery.recommendedCapacityAh;
  const solarWp = output?.solar.requiredWp;
  const invW = output?.inverter.recommendedW;
  const boostA =
    output?.booster.needed && output.booster.outputCurrentA > 0
      ? output.booster.outputCurrentA
      : null;

  const coverage =
    output?.battery.coverageRatio != null
      ? Math.round(output.battery.coverageRatio * 100)
      : 0;

  const systemTitle =
    SYSTEM_CARDS.find((c) => c.value === input.systemVoltage)?.title ?? "—";
  const vehicleTitle =
    VEHICLE_CARDS.find((c) => c.value === input.vehicleVoltage)?.title ?? "—";
  const batteryTitle =
    BATTERY_CARDS.find((c) => c.value === input.batteryPreference)?.title ?? "—";

  const energyLine =
    input.energySources.length === 0
      ? "Noch keine Quelle gewählt"
      : input.energySources.map((id) => ENERGY_SOURCE_LABELS[id]).join(" · ");

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">
          Dein Setup · Live
        </p>
      </div>

      {step === 1 || step === 2 ? (
        <div className="rounded-lg border border-border-1 bg-bg-2 p-4 shadow-[var(--shadow-sm)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-3">Deine Basis</p>
          <dl className="space-y-2.5 text-sm">
            {input.vehicleName?.trim() ? (
              <div>
                <dt className="text-xs text-fg-3">Fahrzeugname</dt>
                <dd className="mt-0.5 text-fg-1">{input.vehicleName.trim()}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-fg-3">Bordnetz</dt>
              <dd className="mt-0.5 text-fg-1">{systemTitle}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Starter / Lichtmaschine</dt>
              <dd className="mt-0.5 text-fg-1">{vehicleTitle}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Haus-Batterie</dt>
              <dd className="mt-0.5 text-fg-1">{batteryTitle}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-lg border border-border-1 bg-bg-2 p-4 shadow-[var(--shadow-sm)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-3">Energie & Dach</p>
          <p className="text-sm text-fg-1">{energyLine}</p>
          {input.energySources.includes("solar") ? (
            <p className="mt-2 text-xs leading-relaxed text-fg-3">
              {input.roofAreas.length} Dachfläche
              {input.roofAreas.length === 1 ? "" : "n"} · Module {roofModuleLabel(input.roofModuleType)}
            </p>
          ) : null}
        </div>
      ) : null}

      <ul className="flex flex-col gap-0">
        {ROWS.map((row, i) => {
          const done = rowDone(step, row.key);
          return (
            <li
              key={row.key}
              className={cn(
                "border-b border-dashed border-border-1 py-2.5 text-sm",
                i === 0 && "border-t border-dashed",
                done ? "text-fg-1" : "text-fg-3",
              )}
            >
              {row.label}
            </li>
          );
        })}
      </ul>

      {enabled ? (
        <div className="rounded-lg border border-border-1 bg-bg-2 p-4 shadow-[var(--shadow-sm)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-3">
            Vorläufige Empfehlung
          </p>
          {loading || !output ? (
            <p className="text-sm text-fg-2">Berechne …</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <ProductIllo kind="battery" size={72} className="shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Stat
                    label="Batterie"
                    value={batAh != null ? Math.round(batAh) : "—"}
                    unit="Ah"
                    size="sm"
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressRing value={coverage} size={40} stroke={4} />
                    <span className="text-xs text-fg-3">Deckung {coverage}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border-1 pt-3">
                <div className="flex items-center gap-2">
                  <ProductIllo kind="solar" size={56} className="rounded-md" />
                  <Stat label="Solar" value={solarWp != null ? Math.round(solarWp) : "—"} unit="Wp" size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <ProductIllo kind="inverter" size={56} className="rounded-md" />
                  <Stat
                    label="Wechselrichter"
                    value={invW != null ? Math.round(invW) : "—"}
                    unit="W"
                    size="sm"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <ProductIllo kind="booster" size={56} className="rounded-md" />
                  <Stat
                    label="Booster / Ladung"
                    value={boostA != null ? boostA.toFixed(1) : "—"}
                    unit="A"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-fg-3">
        Alle Angaben werden live berechnet. Kein Account nötig — Daten bleiben in diesem Browser,
        bis du speicherst.
      </p>
    </div>
  );
}
