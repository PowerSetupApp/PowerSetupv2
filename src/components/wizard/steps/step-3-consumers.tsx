"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import type { Consumer, ConsumerVoltage, SimultaneousLoad } from "@/lib/algorithm/types";
import type { WizardConsumerTemplate } from "@/lib/db/wizard-consumer-templates";
import { useWizardStore } from "@/store/wizard";

function newConsumerId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c-${Date.now()}`;
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

function consumerFromTemplate(t: WizardConsumerTemplate): Consumer {
  const base: Consumer = {
    id: newConsumerId(),
    name: t.name,
    power: t.defaultPower,
    daily: t.defaultHoursPerDay,
    voltage: t.defaultVoltage,
  };
  if (t.isCooling) {
    return { ...base, coolingMethod: "compressor" };
  }
  return base;
}

export interface Step3ConsumersProps {
  templates?: WizardConsumerTemplate[];
}

export function Step3Consumers({ templates = [] }: Step3ConsumersProps) {
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
    <div className="flex flex-col gap-8">
      <WizardStepHeader
        title="Verbraucher"
        description="Mindestens ein Gerät — Leistung in Watt und Nutzungsdauer pro Tag. Vorlagen aus der Datenbank kannst du mit einem Tipp übernehmen."
      />
      {templates.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/35 bg-primary/[0.06] p-4">
          <p className={labelClassName("mb-3")}>Vorlagen aus dem Katalog</p>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {templates.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto min-h-11 max-w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left"
                onClick={() => patchInput({ consumers: [...input.consumers, consumerFromTemplate(t)] })}
              >
                <span className="font-medium text-foreground">{t.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{t.categoryName}</span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        {input.consumers.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="min-w-0 flex-1 sm:min-w-[160px]">
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
            <div className="sm:min-w-[150px]">
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
              className="size-11 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeConsumer(c.id)}
              aria-label="Verbraucher entfernen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-12 min-h-12 w-full rounded-2xl sm:w-auto"
        onClick={() => patchInput({ consumers: [...input.consumers, defaultConsumer()] })}
      >
        Verbraucher hinzufügen
      </Button>
      <div>
        <span className={labelClassName()}>Gleichzeitige 230-V-Last</span>
        <p className="mb-2 text-xs leading-relaxed text-muted-foreground">Nur relevant, wenn du 230-V-Verbraucher einträgst.</p>
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
