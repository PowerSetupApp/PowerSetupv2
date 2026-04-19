"use client";

import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import { useWizardStore } from "@/store/wizard";

import { CableGroups } from "./cable-groups";

export function Step6Cables() {
  const input = useWizardStore((s) => s.input);
  const setCableLengths = useWizardStore((s) => s.setCableLengths);

  return (
    <div className="flex flex-col gap-6">
      <WizardStepHeader
        title="Kabelwege & Platzierung"
        description="Schätze die Entfernung zwischen den Komponenten — nur die Strecken, die zu deinen Quellen in Schritt 2 (und ggf. 230-V-Verbrauchern) passen."
      />
      <CableGroups input={input} setCableLengths={setCableLengths} />
    </div>
  );
}
