"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import type { BatteryPreference, SystemVoltage, VehicleVoltage } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

export function Step1Basics() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System-Basis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bordnetz, Starterbatterie und bevorzugte Haus-Batterie-Chemie.
        </p>
      </div>
      <div>
        <span className={labelClassName()}>Bordspannung</span>
        <SegmentedControl<SystemVoltage>
          options={[
            { value: 12, label: "12 V" },
            { value: 24, label: "24 V" },
            { value: 48, label: "48 V" },
          ]}
          value={input.systemVoltage}
          onChange={(systemVoltage) => patchInput({ systemVoltage })}
        />
      </div>
      <div>
        <span className={labelClassName()}>Starterbatterie</span>
        <SegmentedControl<VehicleVoltage>
          options={[
            { value: 12, label: "12 V" },
            { value: 24, label: "24 V" },
          ]}
          value={input.vehicleVoltage}
          onChange={(vehicleVoltage) => patchInput({ vehicleVoltage })}
        />
      </div>
      <div>
        <span className={labelClassName()}>Batterie-Typ (Präferenz)</span>
        <SegmentedControl<BatteryPreference>
          options={[
            { value: "lifepo4", label: "LiFePO₄" },
            { value: "agm", label: "AGM" },
            { value: "gel", label: "Gel" },
          ]}
          value={input.batteryPreference}
          onChange={(batteryPreference) => patchInput({ batteryPreference })}
        />
      </div>
    </div>
  );
}
