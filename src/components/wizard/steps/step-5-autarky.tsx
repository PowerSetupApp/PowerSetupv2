"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import type { AutarchyDays } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

const DAYS: AutarchyDays[] = [2, 6, 10, 14, 20, 999];

export function Step5Autarky() {
  const autarchyDays = useWizardStore((s) => s.input.autarchyDays);
  const patchInput = useWizardStore((s) => s.patchInput);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Autarkie-Ziel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gewünschte Tage ohne externe Nachladung (ohne Fahren / ohne Landstrom).
        </p>
      </div>
      <div>
        <span className={labelClassName()}>Tage</span>
        <SegmentedControl<AutarchyDays>
          size="sm"
          options={DAYS.map((value) => ({
            value,
            label: value === 999 ? "Maximum" : `${value} Tage`,
          }))}
          value={autarchyDays}
          onChange={(autarchyDaysNext) => patchInput({ autarchyDays: autarchyDaysNext })}
        />
      </div>
    </div>
  );
}
