"use client";

import { CardSelection } from "@/components/ui/card-selection";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import { wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import { useWizardStore } from "@/store/wizard";

import {
  BATTERY_CARDS,
  BatteryPreferenceHint,
  SECTION_BATTERY,
  SECTION_SYSTEM,
  SECTION_VEHICLE,
  STEP1_DESCRIPTION,
  STEP1_TITLE,
  SUB_BATTERY,
  SUB_SYSTEM,
  SUB_VEHICLE,
  SYSTEM_CARDS,
  SystemVoltageHint,
  VEHICLE_CARDS,
  VehicleVoltageHint,
} from "./basics-options";

const ID_SYSTEM = "step1-basics-system";
const ID_VEHICLE = "step1-basics-vehicle";
const ID_BATTERY = "step1-basics-battery";

export function Step1Basics() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  return (
    <div className="flex flex-col gap-8">
      <WizardStepHeader title={STEP1_TITLE} description={STEP1_DESCRIPTION} />

      <section className="space-y-3" aria-labelledby={ID_SYSTEM}>
        <div className="space-y-2">
          <h3 id={ID_SYSTEM} className={wizardSectionLabel()}>
            {SECTION_SYSTEM}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{SUB_SYSTEM}</p>
        </div>
        <CardSelection
          labelId={ID_SYSTEM}
          options={SYSTEM_CARDS}
          value={input.systemVoltage}
          onChange={(systemVoltage) => patchInput({ systemVoltage })}
          columns={3}
        />
        <SystemVoltageHint />
      </section>

      <section className="space-y-3" aria-labelledby={ID_VEHICLE}>
        <div className="space-y-2">
          <h3 id={ID_VEHICLE} className={wizardSectionLabel()}>
            {SECTION_VEHICLE}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{SUB_VEHICLE}</p>
        </div>
        <CardSelection
          labelId={ID_VEHICLE}
          options={VEHICLE_CARDS}
          value={input.vehicleVoltage}
          onChange={(vehicleVoltage) => patchInput({ vehicleVoltage })}
          columns={3}
        />
        <VehicleVoltageHint />
      </section>

      <section className="space-y-3" aria-labelledby={ID_BATTERY}>
        <div className="space-y-2">
          <h3 id={ID_BATTERY} className={wizardSectionLabel()}>
            {SECTION_BATTERY}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{SUB_BATTERY}</p>
        </div>
        <CardSelection
          labelId={ID_BATTERY}
          options={BATTERY_CARDS}
          value={input.batteryPreference}
          onChange={(batteryPreference) => patchInput({ batteryPreference })}
          columns={3}
        />
        <BatteryPreferenceHint />
      </section>
    </div>
  );
}
