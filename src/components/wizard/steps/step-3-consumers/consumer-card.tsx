"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Info, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { inputClassName, labelClassName } from "@/components/wizard/field-styles";
import type { Consumer, ConsumerVoltage, SystemVoltage } from "@/lib/algorithm/types";

import { DeviceIconSlot } from "./device-icon-slot";

type ConsumerCardProps = {
  systemVoltage: SystemVoltage;
  consumer: Consumer;
  expanded: boolean;
  /** When true, summary row does not collapse (single consumer). */
  collapseDisabled?: boolean;
  onToggleExpanded: () => void;
  onUpdate: (patch: Partial<Consumer>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

export function ConsumerCard({
  systemVoltage,
  consumer: c,
  expanded,
  collapseDisabled = false,
  onToggleExpanded,
  onUpdate,
  onRemove,
  onDuplicate,
}: ConsumerCardProps) {
  const [showAverageInfo, setShowAverageInfo] = useState(false);
  const dcVoltageOptions: { value: ConsumerVoltage; label: string }[] = [
    { value: systemVoltage, label: `${systemVoltage} V` },
    { value: 230, label: "230 V" },
  ];
  const showHours = c.showHoursField !== false;
  const hoursStep = c.dailyStep ?? 0.5;
  const avgPct = typeof c.averageLoadPercent === "number" ? c.averageLoadPercent : null;
  const hasAverage = avgPct !== null && avgPct > 0 && avgPct < 100;
  const avgWatt = hasAverage ? Math.round((c.power * (avgPct ?? 100)) / 100) : null;
  /** Katalog-Vorlagen tragen `sourceDeviceId`; nur frei angelegte Verbraucher brauchen ein Namensfeld. */
  const showNameField = c.sourceDeviceId == null;
  const summaryLine = [
    `${c.power} W`,
    showHours
      ? `${c.daily.toLocaleString("de-DE", { maximumFractionDigits: 2 })} h/Tag`
      : null,
    `${c.voltage} V`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`rounded-xl border bg-card p-3 shadow-sm sm:p-4 ${
        expanded ? "border-primary/45 ring-1 ring-primary/15" : "border-border/80"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onToggleExpanded}
          disabled={collapseDisabled}
          aria-expanded={expanded}
          className={`flex min-h-12 flex-1 items-center gap-3 rounded-xl text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring ${
            collapseDisabled ? "cursor-default opacity-95" : ""
          }`}
        >
          <DeviceIconSlot icon={c.deviceIcon} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium leading-snug text-foreground">{c.name}</p>
            <p className="truncate text-sm text-muted-foreground">{summaryLine}</p>
          </div>
          {!collapseDisabled ? (
            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <span className="hidden text-xs font-medium text-foreground sm:inline">
                {expanded ? "Schließen" : "Bearbeiten"}
              </span>
              {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
            </span>
          ) : null}
        </button>
        {!expanded ? (
          <div className="flex shrink-0 justify-end gap-1 sm:flex-col sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 min-h-11 min-w-11 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              aria-label="Verbraucher duplizieren"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 min-h-11 min-w-11 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Verbraucher entfernen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
          {showNameField ? (
            <div className="min-w-0 w-full sm:min-w-[200px] sm:max-w-md sm:flex-1">
              <label className={labelClassName()} htmlFor={`name-${c.id}`}>
                Name
              </label>
              <input
                id={`name-${c.id}`}
                className={inputClassName()}
                value={c.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>
          ) : null}
          <div>
            <div className="flex items-center gap-1">
              <span className={labelClassName()}>Leistung (W)</span>
              {hasAverage ? (
                <button
                  type="button"
                  onClick={() => setShowAverageInfo((v) => !v)}
                  aria-expanded={showAverageInfo}
                  aria-label="Info zur Durchschnittsleistung"
                  className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Info className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
            <NumberStepper min={1} max={5000} step={5} value={c.power} onChange={(power) => onUpdate({ power })} />
            {hasAverage ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Ø {avgWatt} W ({avgPct}% der Nennleistung) für Tagesverbrauch
              </p>
            ) : null}
            {hasAverage && showAverageInfo ? (
              <div
                role="note"
                className="mt-2 rounded-md border border-border/70 bg-muted/40 p-2 text-xs leading-relaxed text-muted-foreground"
              >
                <strong className="font-medium text-foreground">Zwei Werte, zwei Zwecke:</strong> Die Nennleistung
                ({c.power} W) ist die Spitzenlast — sie bestimmt die Wechselrichtergröße. Im Alltag nutzt du das Gerät
                meist nicht auf Volllast. Für den Tagesverbrauch rechnen wir daher mit einer Durchschnittslast von{" "}
                {avgPct}% ≈ {avgWatt} W × {c.daily.toLocaleString("de-DE", { maximumFractionDigits: 2 })} h/Tag. Der
                Prozentwert stammt aus dem Katalog und ist pro Gerät konservativ geschätzt.
              </div>
            ) : null}
          </div>
          {showHours ? (
            <div>
              <span className={labelClassName()}>h / Tag</span>
              <NumberStepper
                min={0.5}
                max={24}
                step={hoursStep}
                value={c.daily}
                onChange={(daily) => onUpdate({ daily })}
              />
            </div>
          ) : null}
          <div className="sm:min-w-[150px]">
            <span className={labelClassName()}>Spannung</span>
            <SegmentedControl
              options={dcVoltageOptions}
              value={c.voltage}
              onChange={(voltage) => onUpdate({ voltage })}
            />
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 min-h-11 rounded-xl px-4"
              onClick={onDuplicate}
            >
              <Copy className="mr-2 size-4" />
              Duplizieren
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              aria-label="Verbraucher entfernen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
