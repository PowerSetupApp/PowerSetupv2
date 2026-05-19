"use client";

import { useWizardStore } from "@/store/wizard";

import { CableGroups } from "./cable-groups";

export function Step6Cables() {
  const input = useWizardStore((s) => s.input);
  const setCableLengths = useWizardStore((s) => s.setCableLengths);

  return (
    <div className="flex flex-col gap-6">
      <CableGroups input={input} setCableLengths={setCableLengths} />
    </div>
  );
}
