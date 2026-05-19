"use client";

import { useEffect, useMemo } from "react";
import { Info } from "lucide-react";

import { CardSelection } from "@/components/ui/card-selection";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { wizardCallout, wizardInsetPanel } from "@/components/wizard/wizard-surfaces";
import { cn } from "@/lib/utils";
import {
  autarchyPresetFromDays,
  autarchyTopUpProfileFromSources,
  getAutarchyWizardMaxDays,
  presetDaysAdaptive,
  type AutarchyPreset,
} from "@/lib/wizard/autarchy-ui";
import { topUpCoversDailyWh } from "@/lib/wizard/top-up-covers-daily";
import { useWizardStore } from "@/store/wizard";

import {
  autarchyPresetCards,
  autarchyProfileAlertDescription,
  AUTARCHY_LIMIT_ALERT_TITLE,
  AUTARCHY_TECH_NOTE,
} from "./autarky-options";

export function Step5Autarky() {
  const input = useWizardStore((s) => s.input);
  const patchInput = useWizardStore((s) => s.patchInput);

  const tripDuration = input.travelBehavior.tripDuration;
  const energySources = input.energySources;
  const maxDays = useMemo(
    () => getAutarchyWizardMaxDays(tripDuration, energySources),
    [tripDuration, energySources],
  );
  const profile = useMemo(
    () => autarchyTopUpProfileFromSources(energySources),
    [energySources],
  );
  const autarchyDays = input.autarchyDays;
  const presetValue = autarchyPresetFromDays(autarchyDays, maxDays);

  const presetOptions = useMemo(() => autarchyPresetCards(maxDays), [maxDays]);

  useEffect(() => {
    let next = autarchyDays;
    if (autarchyDays === 999) {
      if (maxDays < 999) next = maxDays;
    } else if (autarchyDays > maxDays) {
      next = maxDays;
    } else if (autarchyDays < 1) {
      next = 1;
    }
    if (next !== autarchyDays) {
      patchInput({ autarchyDays: next });
    }
  }, [autarchyDays, maxDays, patchInput]);

  const handlePreset = (preset: AutarchyPreset) => {
    patchInput({ autarchyDays: presetDaysAdaptive(preset, maxDays) });
  };

  const sliderDays = Math.min(Math.max(autarchyDays, 1), maxDays);
  const topUpCoversDaily = useMemo(() => topUpCoversDailyWh(input), [input]);

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-6">
        <div
          className={cn(
            wizardInsetPanel(),
            "flex gap-3 border-primary/25 bg-muted/20 text-sm text-muted-foreground",
          )}
        >
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold text-foreground">{AUTARCHY_LIMIT_ALERT_TITLE}</p>
            <p className="mt-1 leading-relaxed">
              {autarchyProfileAlertDescription(profile, maxDays)}
            </p>
          </div>
        </div>

        <CardSelection
          options={presetOptions}
          value={presetValue}
          onChange={(v) => handlePreset(v as AutarchyPreset)}
          columns={3}
        />

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <Label htmlFor="autarky-days-slider" className="text-base font-medium text-foreground">
              {sliderDays} {sliderDays === 1 ? "Tag" : "Tage"}
            </Label>
            <span className="text-xs text-muted-foreground">1 – {maxDays} Tage</span>
          </div>
          <Slider
            id="autarky-days-slider"
            min={1}
            max={maxDays}
            step={1}
            value={sliderDays}
            onValueChange={(d) => patchInput({ autarchyDays: d })}
          />
          {topUpCoversDaily === true ? (
            <p className={wizardCallout()}>
              Hinweis: Mit deinen gewählten Quellen (Solar und/oder Lichtmaschine) deckt die Einspeisung den
              Tagesbedarf bereits — die Autarkie-Tage wirken dann kaum auf die Batteriegröße in Schritt 8, weil die
              1-Tages-Reserve ohne Nachschub immer eingeplant ist.
            </p>
          ) : null}
          <p className={wizardCallout()}>{AUTARCHY_TECH_NOTE}</p>
        </div>
      </div>
    </div>
  );
}
