"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SimpleSelect } from "@/components/ui/simple-select";
import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import type { RoofArea } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

import {
  ROOF_AREA_NAME_OPTIONS,
  ROOF_DIM_STEP,
  ROOF_LENGTH_MAX,
  ROOF_LENGTH_MIN,
  ROOF_WIDTH_MAX,
  ROOF_WIDTH_MIN,
  clampRoofDimension,
  isPresetRoofName,
} from "./constants";

type Props = {
  area: RoofArea;
  index: number;
  canRemove: boolean;
  onPatch: (index: number, patch: Partial<Pick<RoofArea, "name" | "length" | "width">>) => void;
  onRemove: (index: number) => void;
};

function parseDimension(raw: string, min: number, max: number): number {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n)) return min;
  return clampRoofDimension(n, min, max, ROOF_DIM_STEP);
}

export function RoofAreaRow({ area, index, canRemove, onPatch, onRemove }: Props) {
  const selectId = `roof-name-${area.id}`;
  const lengthId = `roof-length-${area.id}`;
  const widthId = `roof-width-${area.id}`;

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className={labelClassName()} htmlFor={selectId}>
            Fläche
          </label>
          <SimpleSelect
            id={selectId}
            value={isPresetRoofName(area.name) ? area.name : ROOF_AREA_NAME_OPTIONS[0]}
            onValueChange={(name) => onPatch(index, { name })}
            options={ROOF_AREA_NAME_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
            triggerClassName={cn(inputClassName(), "h-11 font-medium")}
          />
        </div>
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            aria-label="Fläche entfernen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName()} htmlFor={lengthId}>
            Länge (cm)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={lengthId}
              type="number"
              inputMode="numeric"
              min={ROOF_LENGTH_MIN}
              max={ROOF_LENGTH_MAX}
              step={ROOF_DIM_STEP}
              className="h-11 min-w-0 flex-1 font-medium"
              value={String(area.length)}
              onChange={(e) => onPatch(index, { length: parseDimension(e.target.value, ROOF_LENGTH_MIN, ROOF_LENGTH_MAX) })}
            />
            <NumberStepper
              className="shrink-0"
              min={ROOF_LENGTH_MIN}
              max={ROOF_LENGTH_MAX}
              step={ROOF_DIM_STEP}
              value={area.length}
              onChange={(length) => onPatch(index, { length })}
            />
          </div>
        </div>
        <div>
          <label className={labelClassName()} htmlFor={widthId}>
            Breite (cm)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={widthId}
              type="number"
              inputMode="numeric"
              min={ROOF_WIDTH_MIN}
              max={ROOF_WIDTH_MAX}
              step={ROOF_DIM_STEP}
              className="h-11 min-w-0 flex-1 font-medium"
              value={String(area.width)}
              onChange={(e) => onPatch(index, { width: parseDimension(e.target.value, ROOF_WIDTH_MIN, ROOF_WIDTH_MAX) })}
            />
            <NumberStepper
              className="shrink-0"
              min={ROOF_WIDTH_MIN}
              max={ROOF_WIDTH_MAX}
              step={ROOF_DIM_STEP}
              value={area.width}
              onChange={(width) => onPatch(index, { width })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
