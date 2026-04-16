"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import type { Consumer, ConsumerVoltage, SimultaneousLoad } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

function newConsumerId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}`;
}

function defaultConsumer(): Consumer {
  return {
    id: newConsumerId(),
    name: "Neuer Verbraucher",
    power: 20,
    daily: 2,
    voltage: 12,
  };
}

export function Step3Consumers() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  const updateConsumer = (id: string, patch: Partial<Consumer>) => {
    patchInput({
      consumers: input.consumers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeConsumer = (id: string) => {
    patchInput({ consumers: input.consumers.filter((c) => c.id !== id) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verbraucher</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mindestens ein Gerät — Leistung (W) und Nutzungsdauer pro Tag (h).
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {input.consumers.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-0 flex-1 sm:min-w-[140px]">
              <label className={labelClassName()} htmlFor={`name-${c.id}`}>
                Name
              </label>
              <input
                id={`name-${c.id}`}
                className={inputClassName()}
                value={c.name}
                onChange={(e) => updateConsumer(c.id, { name: e.target.value })}
              />
            </div>
            <div>
              <span className={labelClassName()}>Leistung (W)</span>
              <NumberStepper min={1} max={5000} step={5} value={c.power} onChange={(power) => updateConsumer(c.id, { power })} />
            </div>
            <div>
              <span className={labelClassName()}>h / Tag</span>
              <NumberStepper
                min={0.5}
                max={24}
                step={0.5}
                value={c.daily}
                onChange={(daily) => updateConsumer(c.id, { daily })}
              />
            </div>
            <div className="sm:min-w-[140px]">
              <span className={labelClassName()}>Spannung</span>
              <SegmentedControl<ConsumerVoltage>
                options={[
                  { value: 12, label: "12 V" },
                  { value: 230, label: "230 V" },
                ]}
                value={c.voltage}
                onChange={(voltage) => updateConsumer(c.id, { voltage })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => removeConsumer(c.id)}
              aria-label="Verbraucher entfernen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" onClick={() => patchInput({ consumers: [...input.consumers, defaultConsumer()] })}>
        Verbraucher hinzufügen
      </Button>
      <div>
        <span className={labelClassName()}>Gleichzeitige 230-V-Last</span>
        <p className="mb-2 text-xs text-muted-foreground">Nur relevant, wenn 230-V-Verbraucher existieren.</p>
        <SegmentedControl<SimultaneousLoad>
          options={[
            { value: "low", label: "Gering" },
            { value: "moderate", label: "Mittel" },
            { value: "high", label: "Hoch" },
          ]}
          value={input.simultaneousLoad}
          onChange={(simultaneousLoad) => patchInput({ simultaneousLoad })}
        />
      </div>
    </div>
  );
}
