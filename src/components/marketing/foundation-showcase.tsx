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
    <section
      aria-labelledby="foundation-title"
      className="motion-safe:fade-up motion-safe:fade-up-delay-2 flex flex-col gap-10 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-[0_18px_50px_-28px_color-mix(in_oklch,var(--foreground)_14%,transparent)] backdrop-blur-sm sm:p-8"
    >
      <div className="flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="foundation-title" className="font-display text-xl font-normal tracking-tight text-foreground sm:text-2xl">
            UI-Bausteine
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Interaktive Vorschau — gleiche Komponenten wie im Wizard. Zustand folgt weiterhin{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">src/store/wizard.ts</code>.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Phase 1 · Foundation</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">ProgressSteps</p>
        <ProgressSteps
          steps={DEMO_STEPS}
          currentStep={step}
          completedSteps={completed}
          onStepClick={setStep}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="min-h-10 rounded-xl" onClick={() => setStep((s) => Math.max(1, s - 1))}>
            Zurück
          </Button>
          <Button type="button" size="sm" className="min-h-10 rounded-xl" onClick={() => setStep((s) => Math.min(DEMO_STEPS.length, s + 1))}>
            Weiter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">IconSelector</p>
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

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">SegmentedControl</p>
        <SegmentedControl
          options={[
            { value: "12", label: "12V" },
            { value: "24", label: "24V" },
          ]}
          value={voltage}
          onChange={setVoltage}
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-foreground">NumberStepper</p>
        <NumberStepper value={hours} onChange={setHours} min={0} max={24} step={0.5} suffix="h/Tag" />
      </div>
    </section>
  );
}
