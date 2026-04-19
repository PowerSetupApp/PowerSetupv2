"use client";

import type { CableLengths } from "@/lib/algorithm/types";
import { NumberStepper } from "@/components/ui/number-stepper";
import { labelClassName } from "@/components/wizard/field-styles";

import { CABLE_FIELD_META, formatCableLengthMeters, snapCableLength } from "./cable-meta";

export function CableLengthRow({
  cableKey,
  value,
  onChange,
}: {
  cableKey: keyof CableLengths;
  value: number;
  onChange: (patch: Partial<CableLengths>) => void;
}) {
  const meta = CABLE_FIELD_META[cableKey];
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className={labelClassName("mb-0 sm:max-w-[min(100%,20rem)] sm:shrink")}>{meta.label}</span>
      <NumberStepper
        min={meta.minM}
        max={meta.maxM}
        step={meta.stepM}
        suffix="m"
        value={value}
        formatValue={(v) => formatCableLengthMeters(v, meta.stepM)}
        onChange={(next) =>
          onChange({
            [cableKey]: snapCableLength(next, meta.minM, meta.maxM, meta.stepM),
          } as Partial<CableLengths>)
        }
        className="shrink-0"
      />
    </div>
  );
}
