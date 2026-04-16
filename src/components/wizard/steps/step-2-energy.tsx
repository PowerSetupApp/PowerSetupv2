"use client";

import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import type { ChargerSpeed, EnergySource, RoofModuleType } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

const SOURCES: { id: EnergySource; label: string }[] = [
  { id: "solar", label: "Solar" },
  { id: "alternator", label: "Lichtmaschine / Booster" },
  { id: "shore_power", label: "Landstrom" },
];

function newRoofId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `roof-${Date.now()}`;
}

export function Step2Energy() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  const hasSolar = input.energySources.includes("solar");
  const hasShore = input.energySources.includes("shore_power");
  const roof = input.roofAreas[0];

  const toggleSource = (source: EnergySource) => {
    const on = input.energySources.includes(source);
    const next = on ? input.energySources.filter((s) => s !== source) : [...input.energySources, source];

    if (on && source === "solar") {
      patchInput({ energySources: next, roofAreas: [], solarBags: [] });
      return;
    }

    if (!on && source === "solar" && input.roofAreas.length === 0) {
      patchInput({
        energySources: next,
        roofAreas: [{ id: newRoofId(), name: "Hauptdach", length: 300, width: 200 }],
      });
      return;
    }

    patchInput({ energySources: next });
  };

  const patchRoof = (patch: { name?: string; length?: number; width?: number }) => {
    if (!roof) return;
    patchInput({
      roofAreas: [{ ...roof, ...patch }],
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <WizardStepHeader
        title="Energiequellen"
        description="Wähle mindestens eine Quelle. Mit Solar legen wir eine erste Dachfläche an — Details kannst du anpassen."
      />
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => {
          const active = input.energySources.includes(s.id);
          return (
            <Button
              key={s.id}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className="min-h-10 rounded-full px-4 transition duration-200 ease-out"
              onClick={() => toggleSource(s.id)}
            >
              {s.label}
            </Button>
          );
        })}
      </div>
      {hasSolar ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:p-5">
          <div>
            <span className={labelClassName()}>Modul-Typ (Dach)</span>
            <SegmentedControl<RoofModuleType>
              options={[
                { value: "rigid", label: "Starr" },
                { value: "flexible", label: "Flexibel" },
              ]}
              value={input.roofModuleType}
              onChange={(roofModuleType) => patchInput({ roofModuleType })}
            />
          </div>
          {roof ? (
            <>
              <div>
                <label className={labelClassName()} htmlFor="roof-name">
                  Flächen-Name
                </label>
                <input
                  id="roof-name"
                  className={inputClassName()}
                  value={roof.name}
                  onChange={(e) => patchRoof({ name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <span className={labelClassName()}>Länge (cm)</span>
                  <NumberStepper
                    min={50}
                    max={1200}
                    step={10}
                    value={roof.length}
                    onChange={(length) => patchRoof({ length })}
                  />
                </div>
                <div>
                  <span className={labelClassName()}>Breite (cm)</span>
                  <NumberStepper
                    min={50}
                    max={800}
                    step={10}
                    value={roof.width}
                    onChange={(width) => patchRoof({ width })}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {hasShore ? (
        <div>
          <span className={labelClassName()}>Ladegeschwindigkeit (Landstrom)</span>
          <SegmentedControl<ChargerSpeed>
            options={[
              { value: "slow", label: "Langsam" },
              { value: "normal", label: "Normal" },
              { value: "fast", label: "Schnell" },
            ]}
            value={input.chargerSpeed}
            onChange={(chargerSpeed) => patchInput({ chargerSpeed })}
          />
        </div>
      ) : null}
    </div>
  );
}
