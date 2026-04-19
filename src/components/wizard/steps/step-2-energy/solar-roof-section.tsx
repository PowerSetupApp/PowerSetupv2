"use client";

import { Plus } from "lucide-react";
import { useLayoutEffect } from "react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import { wizardInsetPanel } from "@/components/wizard/wizard-surfaces";
import type { AlgorithmInput, RoofModuleType } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

import {
  DEFAULT_ROOF_LENGTH_CM,
  DEFAULT_ROOF_WIDTH_CM,
  ROOF_AREA_NAME_OPTIONS,
  isPresetRoofName,
} from "./constants";
import { RoofAreaRow } from "./roof-area-row";
import { newRoofId } from "./roof-utils";

type Props = {
  roofAreas: AlgorithmInput["roofAreas"];
  roofModuleType: RoofModuleType;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
};

export function SolarRoofSection({ roofAreas, roofModuleType, patchInput }: Props) {
  useLayoutEffect(() => {
    let changed = false;
    const next = roofAreas.map((r) => {
      if (isPresetRoofName(r.name)) return r;
      changed = true;
      return { ...r, name: ROOF_AREA_NAME_OPTIONS[0] };
    });
    if (changed) patchInput({ roofAreas: next });
  }, [roofAreas, patchInput]);

  const patchRoofAt = (index: number, patch: Partial<{ name: string; length: number; width: number }>) => {
    patchInput({
      roofAreas: roofAreas.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  };

  const addRoof = () => {
    patchInput({
      roofAreas: [
        ...roofAreas,
        {
          id: newRoofId(),
          name: ROOF_AREA_NAME_OPTIONS[0],
          length: DEFAULT_ROOF_LENGTH_CM,
          width: DEFAULT_ROOF_WIDTH_CM,
        },
      ],
    });
  };

  const removeRoof = (index: number) => {
    if (roofAreas.length <= 1) return;
    patchInput({ roofAreas: roofAreas.filter((_, i) => i !== index) });
  };

  return (
    <div className={cn(wizardInsetPanel(), "flex flex-col gap-5")}>
      <div>
        <span className={labelClassName()}>Modul-Typ (Dach)</span>
        <SegmentedControl
          options={[
            { value: "rigid", label: "Starr" },
            { value: "flexible", label: "Flexibel" },
          ]}
          value={roofModuleType}
          onChange={(next) => patchInput({ roofModuleType: next })}
        />
      </div>
      <div className="flex flex-col gap-3">
        <span className={labelClassName("mb-0")}>Dachflächen</span>
        {roofAreas.map((area, index) => (
          <RoofAreaRow
            key={area.id}
            area={area}
            index={index}
            canRemove={roofAreas.length > 1}
            onPatch={patchRoofAt}
            onRemove={removeRoof}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full border-dashed border-border/80 bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={addRoof}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Weitere Fläche hinzufügen
        </Button>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Bei Dachfenstern oder Lüftern: mehrere getrennte Flächen anlegen, damit die nutzbare Modulfläche realistisch bleibt.
        </p>
      </div>
    </div>
  );
}
