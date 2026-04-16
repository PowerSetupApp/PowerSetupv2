"use client";

import * as React from "react";
import { Bus, Car, Sailboat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconSelector } from "@/components/ui/icon-selector";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ProgressSteps, type Step } from "@/components/ui/progress-steps";
import { SegmentedControl } from "@/components/ui/segmented-control";

const DEMO_STEPS: Step[] = [
  { id: 1, label: "Fahrzeug" },
  { id: 2, label: "Energie" },
  { id: 3, label: "Verbraucher" },
  { id: 4, label: "Reise" },
  { id: 5, label: "Autarkie" },
  { id: 6, label: "Kabel" },
  { id: 7, label: "Marken" },
  { id: 8, label: "Check" },
];

export function FoundationShowcase() {
  const [vehicle, setVehicle] = React.useState<"van" | "car" | "boat">("van");
  const [voltage, setVoltage] = React.useState<"12" | "24">("12");
  const [hours, setHours] = React.useState(2);
  const [step, setStep] = React.useState(1);
  const completed = React.useMemo(() => {
    return Array.from({ length: step - 1 }, (_, i) => i + 1);
  }, [step]);

  return (
    <section className="flex flex-col gap-10 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Phase-1 UI-Bausteine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nur Demonstration — noch kein Wizard-State (kommt PS-1 / Phase 3).
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">ProgressSteps</p>
        <ProgressSteps
          steps={DEMO_STEPS}
          currentStep={step}
          completedSteps={completed}
          onStepClick={setStep}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Zurück
          </Button>
          <Button type="button" size="sm" onClick={() => setStep((s) => Math.min(DEMO_STEPS.length, s + 1))}>
            Weiter
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">IconSelector</p>
        <IconSelector
          options={[
            { value: "van", label: "Van / Wohnmobil", icon: <Bus className="mx-auto" /> },
            { value: "car", label: "PKW / Kasten", icon: <Car className="mx-auto" /> },
            { value: "boat", label: "Boot", icon: <Sailboat className="mx-auto" /> },
          ]}
          value={vehicle}
          onChange={setVehicle}
          columns={3}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">SegmentedControl</p>
        <SegmentedControl
          options={[
            { value: "12", label: "12V" },
            { value: "24", label: "24V" },
          ]}
          value={voltage}
          onChange={setVoltage}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">NumberStepper</p>
        <NumberStepper value={hours} onChange={setHours} min={0} max={24} step={0.5} suffix="h/Tag" />
      </div>
    </section>
  );
}
