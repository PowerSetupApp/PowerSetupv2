"use client";

import { NumberStepper } from "@/components/ui/number-stepper";
import { labelClassName } from "@/components/wizard/field-styles";
import { useWizardStore } from "@/store/wizard";

export function Step6Cables() {
  const cableLengths = useWizardStore((s) => s.input.cableLengths);
  const setCableLengths = useWizardStore((s) => s.setCableLengths);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kabellängen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Schätzung in Metern — Standardwerte sind ein guter Start.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={labelClassName()}>Solar → Regler</span>
          <NumberStepper
            min={0.5}
            max={30}
            step={0.5}
            suffix="m"
            value={cableLengths.solarToRegulator}
            onChange={(solarToRegulator) => setCableLengths({ solarToRegulator })}
          />
        </div>
        <div>
          <span className={labelClassName()}>Regler → Batterie</span>
          <NumberStepper
            min={0.5}
            max={15}
            step={0.5}
            suffix="m"
            value={cableLengths.regulatorToService}
            onChange={(regulatorToService) => setCableLengths({ regulatorToService })}
          />
        </div>
        <div>
          <span className={labelClassName()}>Batterie → Wechselrichter</span>
          <NumberStepper
            min={0.5}
            max={15}
            step={0.5}
            suffix="m"
            value={cableLengths.serviceToInverter}
            onChange={(serviceToInverter) => setCableLengths({ serviceToInverter })}
          />
        </div>
        <div>
          <span className={labelClassName()}>Batterie → Sicherungskasten</span>
          <NumberStepper
            min={0.5}
            max={15}
            step={0.5}
            suffix="m"
            value={cableLengths.batteryToFuseBox}
            onChange={(batteryToFuseBox) => setCableLengths({ batteryToFuseBox })}
          />
        </div>
      </div>
    </div>
  );
}
