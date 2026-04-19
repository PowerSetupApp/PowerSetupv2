"use client";

import { useState } from "react";

import type { CanonicalPreviewState } from "@/components/wizard/steps/use-wizard-step8-canonical-previews";
import { Step8SolarBags } from "@/components/wizard/steps/step-8-solar-bags";
import { Step8SolarBatteryBalance } from "@/components/wizard/steps/step-8-solar-battery-balance";
import { wizardInsetPanel, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

type Props = {
  input: AlgorithmInput;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
  canonical: CanonicalPreviewState;
  canSubmit: boolean;
  onDisplayOutput: (output: AlgorithmOutput | null) => void;
  onHardFloorBinding: (bound: boolean) => void;
};

export function Step8SolarBatteryCard({
  input,
  patchInput,
  canonical,
  canSubmit,
  onDisplayOutput,
  onHardFloorBinding,
}: Props) {
  const [open, setOpen] = useState(true);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={wizardSectionLabel()}>Solar &amp; Batterie</span>
        <span className="text-xs text-muted-foreground">{open ? "Einklappen" : "Ausklappen"}</span>
      </button>
      {open ? (
        <div className={cn(wizardInsetPanel(), "flex flex-col gap-6")}>
          <Step8SolarBags input={input} patchInput={patchInput} disabled={!canSubmit} />
          <Step8SolarBatteryBalance
            input={input}
            patchInput={patchInput}
            canonical={canonical}
            disabled={!canSubmit}
            onDisplayOutput={onDisplayOutput}
            onHardFloorBinding={onHardFloorBinding}
          />
        </div>
      ) : null}
    </section>
  );
}
