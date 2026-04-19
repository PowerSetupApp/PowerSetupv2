"use client";

import { useLayoutEffect } from "react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import type { EnergySource } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

import { SolarRoofSection } from "./solar-roof-section";
import { defaultRoofArea } from "./roof-utils";

const SOURCES: { id: EnergySource; label: string }[] = [
  { id: "solar", label: "Solar" },
  { id: "alternator", label: "Lichtmaschine / Booster" },
  { id: "shore_power", label: "Landstrom" },
];

export function Step2Energy() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  const hasSolar = input.energySources.includes("solar");
  const hasShore = input.energySources.includes("shore_power");

  useLayoutEffect(() => {
    if (hasSolar && input.roofAreas.length === 0) {
      patchInput({ roofAreas: [defaultRoofArea()] });
    }
  }, [hasSolar, input.roofAreas.length, patchInput]);

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
        roofAreas: [defaultRoofArea()],
      });
      return;
    }

    patchInput({ energySources: next });
  };

  return (
    <div className="flex flex-col gap-6">
      <WizardStepHeader
        title="Energiequellen"
        description={`Wähle mindestens eine Quelle. Mit Solar legen wir eine erste Dachfläche an — weitere Flächen kannst du bei Bedarf ergänzen. Booster- und Leitungsberechnungen nutzen deine Spannungen aus Schritt 1: Bordnetz ${input.systemVoltage} V, Starter ${input.vehicleVoltage} V.`}
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
      {hasSolar && input.roofAreas.length > 0 ? (
        <SolarRoofSection
          roofAreas={input.roofAreas}
          roofModuleType={input.roofModuleType}
          patchInput={patchInput}
        />
      ) : null}
      {hasShore ? (
        <div>
          <span className={labelClassName()}>Ladegeschwindigkeit (Landstrom)</span>
          <SegmentedControl
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
