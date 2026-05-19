"use client";

import { CardSelection } from "@/components/ui/card-selection";
import { Input } from "@/components/ui/input";
import { WizardSectionHint } from "@/components/wizard/wizard-section-hint";
import { wizardFormSection, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import { useWizardStore } from "@/store/wizard";

import {
  BATTERY_CARDS,
  BatteryPreferenceHintBody,
  SECTION_BATTERY,
  SECTION_SYSTEM,
  SECTION_VEHICLE,
  SUB_BATTERY,
  SUB_SYSTEM,
  SUB_VEHICLE,
  SYSTEM_CARDS,
  SystemVoltageHintBody,
  VEHICLE_CARDS,
  VehicleVoltageHintBody,
} from "./basics-options";

const ID_VEHICLE_TITLE = "step1-vehicle-title";
const ID_VEHICLE_INPUT = "step1-vehicle-input";
const ID_SYSTEM = "step1-basics-system";
const ID_VEHICLE = "step1-basics-vehicle";
const ID_BATTERY = "step1-basics-battery";

export function Step1Basics() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  return (
    <div className="flex max-w-[var(--form-max)] flex-col gap-10">
      <section className={wizardFormSection()} aria-labelledby={ID_VEHICLE_TITLE}>
        <div className="flex w-full flex-col gap-4">
          <h3 id={ID_VEHICLE_TITLE} className={wizardSectionLabel()}>
            Wie nennst du dein Fahrzeug?
          </h3>
          <Input
            id={ID_VEHICLE_INPUT}
            placeholder="z. B. unser T6"
            maxLength={60}
            value={input.vehicleName ?? ""}
            onChange={(e) => patchInput({ vehicleName: e.target.value })}
          />
          <p className="text-xs leading-relaxed text-fg-2">
            Nur für die Anzeige auf deinem Bauplan — völlig optional.
          </p>
        </div>
      </section>

      <section className={wizardFormSection()} aria-labelledby={ID_SYSTEM}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 id={ID_SYSTEM} className={wizardSectionLabel()}>
              {SECTION_SYSTEM}
            </h3>
            <WizardSectionHint ariaLabel="Ausführlicher Hinweis zur Systemspannung">
              <SystemVoltageHintBody />
            </WizardSectionHint>
          </div>
          <p className="text-xs leading-relaxed text-fg-2">{SUB_SYSTEM}</p>
        </div>
        <CardSelection
          labelId={ID_SYSTEM}
          options={SYSTEM_CARDS}
          value={input.systemVoltage}
          onChange={(systemVoltage) => patchInput({ systemVoltage })}
          columns={3}
        />
      </section>

      <section className={wizardFormSection()} aria-labelledby={ID_VEHICLE}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 id={ID_VEHICLE} className={wizardSectionLabel()}>
              {SECTION_VEHICLE}
            </h3>
            <WizardSectionHint ariaLabel="Ausführlicher Hinweis zur Fahrzeugspannung">
              <VehicleVoltageHintBody />
            </WizardSectionHint>
          </div>
          <p className="text-xs leading-relaxed text-fg-2">{SUB_VEHICLE}</p>
        </div>
        <CardSelection
          labelId={ID_VEHICLE}
          options={VEHICLE_CARDS}
          value={input.vehicleVoltage}
          onChange={(vehicleVoltage) => patchInput({ vehicleVoltage })}
          columns={3}
        />
      </section>

      <section className={wizardFormSection()} aria-labelledby={ID_BATTERY}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 id={ID_BATTERY} className={wizardSectionLabel()}>
              {SECTION_BATTERY}
            </h3>
            <WizardSectionHint
              ariaLabel="Ausführlicher Hinweis zur Batteriewahl"
              panelClassName="border-forest-500/35 bg-forest-50 dark:border-forest-300/40 dark:bg-forest-500/10"
            >
              <BatteryPreferenceHintBody />
            </WizardSectionHint>
          </div>
          <p className="text-xs leading-relaxed text-fg-2">{SUB_BATTERY}</p>
        </div>
        <CardSelection
          labelId={ID_BATTERY}
          options={BATTERY_CARDS}
          value={input.batteryPreference}
          onChange={(batteryPreference) => patchInput({ batteryPreference })}
          columns={3}
        />
      </section>
    </div>
  );
}
