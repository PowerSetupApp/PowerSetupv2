"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import { wizardFormSection, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import type { EnergySource } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

import {
  AlternatorSourceIcon,
  ShorePowerSourceIcon,
  SolarSourceIcon,
} from "./energy-source-icons";
import { SolarRoofSection } from "./solar-roof-section";
import { defaultRoofArea } from "./roof-utils";

const SOURCES: { id: EnergySource; label: string; icon: ReactNode }[] = [
  { id: "solar", label: "Solar", icon: <SolarSourceIcon /> },
  { id: "alternator", label: "Lichtmaschine / Booster", icon: <AlternatorSourceIcon /> },
  { id: "shore_power", label: "Landstrom (230 V)", icon: <ShorePowerSourceIcon /> },
];

export function Step2Energy() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  const hasSolar = input.energySources.includes("solar");
  const hasShore = input.energySources.includes("shore_power");
  const hasAlternator = input.energySources.includes("alternator");

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
    <div className="flex flex-col gap-10">
      <section className={wizardFormSection()} aria-labelledby="step2-energy-sources">
        <div className="space-y-1">
          <h3 id="step2-energy-sources" className={wizardSectionLabel()}>
            Welche Energiequellen hast du?
          </h3>
          <p className="text-xs leading-relaxed text-fg-2">Mehrfachauswahl. Mindestens eine Quelle ist nötig.</p>
        </div>
        <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="step2-energy-sources">
          {SOURCES.map((s) => {
            const active = input.energySources.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                className="rounded-full border-0 bg-transparent p-0"
                onClick={() => toggleSource(s.id)}
              >
                <Chip tone={active ? "amber" : "neutral"} size="md" className="gap-1.5 px-3.5 py-2" icon={s.icon}>
                  {s.label}
                </Chip>
              </button>
            );
          })}
        </div>
      </section>

      {hasSolar && input.roofAreas.length > 0 ? (
        <SolarRoofSection roofAreas={input.roofAreas} roofModuleType={input.roofModuleType} patchInput={patchInput} />
      ) : null}

      {hasAlternator ? (
        <div className="rounded-lg border border-border-1 bg-bg-3/60 px-4 py-3 text-sm text-fg-2">
          DC-DC-Booster wird bei der Auslegung automatisch berücksichtigt.
        </div>
      ) : null}

      {hasShore ? (
        <div className="space-y-2">
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
