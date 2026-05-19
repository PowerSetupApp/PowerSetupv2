"use client";

import { Button } from "@/components/ui/button";
import { wizardCallout, wizardInsetPanel, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import type { AlgorithmOutput, ControllerRecommendation } from "@/lib/algorithm/types";
import { cn } from "@/lib/utils";

type SummaryRow = { label: string; value: string; sub?: string };

function formatCurrent(a: number): string {
  return `${Math.round(a * 10) / 10} A`;
}

/** Older API payloads / cached JSON may omit `portableController` or `scope`. */
function roofControllerFallback(): ControllerRecommendation {
  return { needed: false, type: "mppt", currentA: 0, maxInputWp: 0, scope: "roof" };
}

function portableControllerFallback(): ControllerRecommendation {
  return { needed: false, type: "mppt", currentA: 0, maxInputWp: 0, scope: "portable" };
}

function buildSummary(output: AlgorithmOutput): SummaryRow[] {
  const solar = output.solar;
  const controller = output.controller ?? roofControllerFallback();
  const portableController =
    output.portableController ?? portableControllerFallback();
  const solarRows: SummaryRow[] = [];
  if (solar.needed) {
    const roofWp = Math.round(solar.maxRoofWp);
    solarRows.push({
      label: "Solar Dach (installiert)",
      value: `${roofWp} Wp`,
      sub:
        solar.requiredWp - solar.maxRoofWp > 1
          ? `Volle Tagesdeckung (PSH) bräuchte ca. ${Math.round(solar.requiredWp)} Wp`
          : undefined,
    });
    if (solar.portableWp > 0) {
      const effectiveWp =
        typeof solar.portableEffectiveWp === "number" &&
        Number.isFinite(solar.portableEffectiveWp)
          ? solar.portableEffectiveWp
          : 0;
      solarRows.push({
        label: "Solartaschen",
        value: `${Math.round(solar.portableWp)} Wp nominal`,
        sub:
          effectiveWp > 0
            ? `ca. ${Math.round(effectiveWp)} Wp effektiv (Ausrichtung × Nutzung)`
            : undefined,
      });
    }
  } else {
    solarRows.push({ label: "Solar", value: "nicht benötigt" });
  }

  const controllerRows: SummaryRow[] = [];
  if (controller.needed) {
    controllerRows.push({
      label: "Solarregler Dach",
      value: `${formatCurrent(controller.currentA)} MPPT`,
      sub: `für ${Math.round(controller.maxInputWp)} Wp Dach-Array`,
    });
  }
  if (portableController.needed) {
    controllerRows.push({
      label: "Solarregler Tasche",
      value: `${formatCurrent(portableController.currentA)} MPPT`,
      sub: `für ${Math.round(portableController.maxInputWp)} Wp Solartaschen`,
    });
  }
  if (controllerRows.length === 0) {
    controllerRows.push({ label: "Solarregler", value: "nicht benötigt" });
  }

  return [
    {
      label: "Batterie",
      value: `${Math.round(output.battery.recommendedCapacityAh * 10) / 10} Ah · ${output.battery.voltage} V`,
    },
    { label: "Tagesverbrauch", value: `${Math.round(output.battery.dailyWh)} Wh` },
    ...solarRows,
    {
      label: "Wechselrichter",
      value: output.inverter.needed ? `${output.inverter.recommendedW} W` : "nicht benötigt",
    },
    { label: "Ladebooster", value: output.booster.needed ? `${output.booster.outputCurrentA} A` : "nicht benötigt" },
    {
      label: "Landstrom-Lader",
      value: output.charger.needed ? `${output.charger.recommendedCurrentA} A` : "nicht benötigt",
    },
    ...controllerRows,
    { label: "Autarkie (erreichbar)", value: `${output.battery.autarchyDays} Tage` },
  ];
}

export function Step8AlgorithmPreview({
  output,
  onAddBag200,
}: {
  output: AlgorithmOutput;
  onAddBag200?: () => void;
}) {
  const rows = buildSummary(output);
  const showShortfall =
    output.solar.needed &&
    output.solar.solarShortfallWh > 0 &&
    onAddBag200 !== undefined;

  return (
    <section className="flex flex-col gap-4">
      <span className={wizardSectionLabel()}>Berechnetes Ergebnis (Vorschau)</span>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-border/70 bg-background p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
            <p className="mt-1 text-base font-semibold text-foreground">{row.value}</p>
            {row.sub ? <p className="mt-1 text-xs text-muted-foreground">{row.sub}</p> : null}
          </div>
        ))}
      </div>
      {showShortfall ? (
        <div className={wizardCallout()}>
          <p className="text-sm">
            Solar-Deckung reicht für den angezeigten Tag nicht vollständig — es fehlen ca.{" "}
            {Math.round(output.solar.solarShortfallWh)} Wh/Tag. Solartasche ergänzen?
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onAddBag200}>
            +200 Wp Solartasche
          </Button>
        </div>
      ) : null}
      {output.cables.length > 0 ? (
        <ul className={cn(wizardInsetPanel(), "flex flex-col gap-1 text-sm")}>
          {output.cables.map((c) => (
            <li key={c.route} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-muted-foreground">{c.displayName}</span>
              <span className="font-semibold text-foreground">
                {c.sizingMethod === "fixed-solar"
                  ? `${c.lengthM} m · ${Math.round(c.currentA)} A (PV-Leitung Standardquerschnitt)`
                  : `${c.recommendedCrossSection} mm² · ${c.lengthM} m · ${Math.round(c.currentA)} A`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
