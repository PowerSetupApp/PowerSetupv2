"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { labelClassName } from "@/components/wizard/field-styles";
import { wizardInsetPanel } from "@/components/wizard/wizard-surfaces";
import {
  SOLAR_BAG_ALIGNMENT_UPLIFT,
  SOLAR_BAG_UTILIZATION,
} from "@/lib/algorithm/constants";
import type { AlgorithmInput, SolarBag } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

const PRESETS = [100, 150, 200, 300, 400] as const;

function newBagId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bag-${Date.now()}`;
}

function effectivePortableWp(bags: SolarBag[], input: AlgorithmInput): number {
  const nominal = bags.reduce((s, b) => s + b.power, 0);
  const { winterLocation, season } = input.travelBehavior;
  const m =
    SOLAR_BAG_ALIGNMENT_UPLIFT[winterLocation][season] * SOLAR_BAG_UTILIZATION;
  return nominal * m;
}

type Props = {
  input: AlgorithmInput;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
  disabled?: boolean;
};

export function Step8SolarBags({ input, patchInput, disabled }: Props) {
  const [lastPreset, setLastPreset] = useState<number>(200);
  const bags = input.solarBags;
  const nominal = bags.reduce((s, b) => s + b.power, 0);
  const effective = effectivePortableWp(bags, input);

  const setPowerAt = (index: number, power: number) => {
    patchInput({
      solarBags: bags.map((b, i) => (i === index ? { ...b, power } : b)),
    });
  };

  const removeAt = (index: number) => {
    patchInput({ solarBags: bags.filter((_, i) => i !== index) });
  };

  const addBag = (power: number) => {
    setLastPreset(power);
    patchInput({ solarBags: [...bags, { id: newBagId(), power }] });
  };

  return (
    <div className={cn(wizardInsetPanel(), "flex flex-col gap-4")}>
      <div>
        <span className={labelClassName()}>Solartaschen (nominal)</span>
        <p className="mt-1 text-xs text-muted-foreground">
          Typische Größen am Markt. Effektive Wp = Nominal × Ausrichtung (Standort/Saison) ×
          Nutzungsgrad ({Math.round(SOLAR_BAG_UTILIZATION * 100)} %).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((wp) => (
          <Button
            key={wp}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => addBag(wp)}
          >
            +{wp} Wp
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {bags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Solartasche hinzugefügt.</p>
        ) : (
          bags.map((bag, index) => {
            const powerOptions = Array.from(new Set<number>([...PRESETS, bag.power])).sort(
              (a, b) => a - b,
            );
            return (
            <div
              key={bag.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background p-2"
            >
              <select
                className="min-h-10 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                value={bag.power}
                disabled={disabled}
                aria-label={`Solartasche ${index + 1} Leistung`}
                onChange={(e) => setPowerAt(index, Number(e.target.value))}
              >
                {powerOptions.map((wp) => (
                  <option key={wp} value={wp}>
                    {wp} Wp
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
                aria-label="Solartasche entfernen"
                onClick={() => removeAt(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            );
          })
        )}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full border-dashed border-border/80"
          disabled={disabled}
          onClick={() => addBag(lastPreset)}
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Weitere ({lastPreset} Wp)
        </Button>
      </div>
      {nominal > 0 ? (
        <p className="text-sm text-muted-foreground">
          Summe nominal: <span className="font-medium text-foreground">{nominal} Wp</span>
          {" → "}
          effektiv ca.{" "}
          <span className="font-medium text-foreground">{Math.round(effective)} Wp</span>
        </p>
      ) : null}
    </div>
  );
}
