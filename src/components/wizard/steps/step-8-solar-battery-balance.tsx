"use client";

import { useCallback, useEffect, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { wizardCallout } from "@/components/wizard/wizard-surfaces";
import type { CanonicalPreviewState } from "@/components/wizard/steps/use-wizard-step8-canonical-previews";
import { buildStep8BalanceOutput } from "@/lib/wizard/step8-solar-battery-balance";
import type { AlgorithmInput, AlgorithmOutput } from "@/lib/algorithm/types";

type Props = {
  input: AlgorithmInput;
  patchInput: (patch: Partial<AlgorithmInput>) => void;
  canonical: CanonicalPreviewState;
  disabled?: boolean;
  /** Called when displayed output changes (for preview + JSON). */
  onDisplayOutput: (output: AlgorithmOutput | null) => void;
  onHardFloorBinding: (bound: boolean) => void;
};

function sliderPercentFromOverrides(
  canonical: Extract<CanonicalPreviewState, { kind: "ok" }>,
  input: AlgorithmInput,
): number {
  const raw = canonical.rawBase;
  const capWp = Math.min(
    raw.solar.requiredWp,
    raw.solar.maxRoofWp + raw.solar.portableWp,
  );
  const { battery, solar } = input.customOverrides;
  if (battery === null && solar === null) return 100;
  if (solar !== null && Number.isFinite(solar) && capWp > 0) {
    return Math.round(Math.min(100, Math.max(0, (solar / capWp) * 100)));
  }
  return 100;
}

export function Step8SolarBatteryBalance({
  input,
  patchInput,
  canonical,
  disabled,
  onDisplayOutput,
  onHardFloorBinding,
}: Props) {
  const hasSolar = input.energySources.includes("solar");

  const sliderPercent = useMemo(() => {
    if (canonical.kind !== "ok" || !hasSolar) return 100;
    return sliderPercentFromOverrides(canonical, input);
  }, [canonical, hasSolar, input]);

  const f = sliderPercent / 100;

  const displayOutput = useMemo(() => {
    if (canonical.kind !== "ok") return null;
    return buildStep8BalanceOutput(
      canonical.rawBase,
      canonical.rawBatteryOnly,
      f,
      hasSolar,
      input.customOverrides,
    );
  }, [canonical, f, hasSolar, input]);

  useEffect(() => {
    onDisplayOutput(displayOutput);
  }, [displayOutput, onDisplayOutput]);

  useEffect(() => {
    if (!displayOutput) {
      onHardFloorBinding(false);
      return;
    }
    onHardFloorBinding(displayOutput.battery.bindingBranch === "hard");
  }, [displayOutput, onHardFloorBinding]);

  const applyOverridesForPercent = useCallback(
    (nextPercent: number) => {
      const nextF = nextPercent / 100;
      if (!hasSolar || canonical.kind !== "ok") return;
      const raw = canonical.rawBase;
      const rawBat = canonical.rawBatteryOnly;
      const capWp = Math.min(
        raw.solar.requiredWp,
        raw.solar.maxRoofWp + raw.solar.portableWp,
      );
      if (nextF >= 1 - 1e-6) {
        patchInput({
          customOverrides: {
            ...input.customOverrides,
            battery: null,
            solar: null,
          },
        });
        return;
      }
      patchInput({
        customOverrides: {
          ...input.customOverrides,
          battery:
            rawBat.battery.recommendedCapacityAh +
            nextF * (raw.battery.recommendedCapacityAh - rawBat.battery.recommendedCapacityAh),
          solar: nextF * capWp,
        },
      });
    },
    [canonical, hasSolar, input, patchInput],
  );

  const gapWp =
    canonical.kind === "ok" && hasSolar
      ? Math.max(
          0,
          canonical.rawBase.solar.requiredWp -
            canonical.rawBase.solar.maxRoofWp -
            canonical.rawBase.solar.portableWp,
        )
      : 0;

  if (!hasSolar) {
    return (
      <p className="text-sm text-muted-foreground">
        Solar ist in Schritt 2 nicht aktiv — hier gibt es keinen Solar/Batterie-Mix zum Einstellen.
      </p>
    );
  }

  if (canonical.kind === "loading" || canonical.kind === "idle") {
    return null;
  }
  if (canonical.kind === "error") {
    return <p className="text-sm text-destructive">{canonical.message}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="solar-battery-balance" className="text-base font-medium text-foreground">
          Solar vs. Batterie
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Standard: Solar zuerst (günstiger). Nach links schieben legt den Fokus stärker auf die Batterie.
        </p>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Mehr Batterie</span>
        <span>Mehr Solar</span>
      </div>
      <Slider
        id="solar-battery-balance"
        min={0}
        max={100}
        step={1}
        value={sliderPercent}
        disabled={disabled}
        ariaValueText={`${sliderPercent} Prozent Solar-Anteil`}
        onValueChange={applyOverridesForPercent}
      />
      <p className="text-center text-sm font-medium text-foreground">{sliderPercent} % Solar-Anteil</p>
      {gapWp > 0 && sliderPercent >= 99 ? (
        <p className={wizardCallout()}>
          Solar-Deckung:{" "}
          {Math.round(canonical.rawBase.solar.maxRoofWp + canonical.rawBase.solar.portableWp)} Wp installiert / ca.{" "}
          {Math.round(canonical.rawBase.solar.requiredWp)} Wp nötig für volle Deckung — der Rest wird über die
          Batterie (Autarkie) abgefangen. Tipp: Solartasche oben ergänzen.
        </p>
      ) : null}
    </div>
  );
}
