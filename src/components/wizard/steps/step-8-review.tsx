"use client";

import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/store/wizard";

export function Step8Review() {
  const input = useWizardStore((s) => s.input);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daten sind lokal zwischengespeichert. Die eigentliche Berechnung erfolgt über{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/generate/[id]</code> (Phase 5).
        </p>
      </div>
      <dl className="grid gap-3 rounded-lg border border-border bg-card/50 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Bordspannung</dt>
          <dd className="font-medium">{input.systemVoltage} V</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Energie</dt>
          <dd className="max-w-[60%] text-right font-medium">{input.energySources.join(", ") || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Verbraucher</dt>
          <dd className="font-medium">{input.consumers.length} Gerät(e)</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Autarkie</dt>
          <dd className="font-medium">{input.autarchyDays === 999 ? "Maximum" : `${input.autarchyDays} Tage`}</dd>
        </div>
      </dl>
      <Button type="button" disabled className="w-full sm:w-auto">
        Berechnen (folgt mit API)
      </Button>
    </div>
  );
}
