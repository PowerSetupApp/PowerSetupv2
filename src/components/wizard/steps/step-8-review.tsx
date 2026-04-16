"use client";

import { Button } from "@/components/ui/button";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import { useWizardStore } from "@/store/wizard";

export function Step8Review() {
  const input = useWizardStore((s) => s.input);

  return (
    <div className="flex flex-col gap-8">
      <WizardStepHeader
        title="Übersicht"
        description="Deine Eingaben sind lokal zwischengespeichert. Die Berechnung läuft erst über den API-Endpunkt in Phase 5."
      />
      <dl className="grid gap-4 rounded-2xl border border-border/70 bg-muted/15 p-5 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Bordspannung</dt>
          <dd className="font-semibold text-foreground">{input.systemVoltage} V</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Energie</dt>
          <dd className="text-right font-semibold text-foreground">{input.energySources.join(", ") || "—"}</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Verbraucher</dt>
          <dd className="font-semibold text-foreground">{input.consumers.length} Gerät(e)</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Autarkie</dt>
          <dd className="font-semibold text-foreground">{input.autarchyDays === 999 ? "Maximum" : `${input.autarchyDays} Tage`}</dd>
        </div>
      </dl>
      <Button type="button" disabled className="h-12 min-h-12 w-full rounded-2xl sm:w-auto">
        Berechnen (folgt mit API)
      </Button>
    </div>
  );
}
