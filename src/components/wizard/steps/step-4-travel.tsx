"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { labelClassName } from "@/components/wizard/field-styles";
import { WizardStepHeader } from "@/components/wizard/wizard-step-header";
import type { Season, StandingDuration, TripDuration, WinterLocation } from "@/lib/algorithm/types";
import { useWizardStore } from "@/store/wizard";

export function Step4Travel() {
  const tb = useWizardStore((s) => s.input.travelBehavior);
  const setTravelBehavior = useWizardStore((s) => s.setTravelBehavior);

  return (
    <div className="flex flex-col gap-8">
      <WizardStepHeader
        title="Reiseverhalten"
        description="Saison, typische Trip-Dauer und Standzeiten — der Algorithmus nutzt das für Ertrag und Reserve."
      />
      <div>
        <span className={labelClassName()}>Hauptsaison</span>
        <SegmentedControl<Season>
          options={[
            { value: "summer", label: "Sommer" },
            { value: "all_year", label: "Ganzjährig" },
            { value: "winter", label: "Winter" },
          ]}
          value={tb.season}
          onChange={(season) => setTravelBehavior({ season })}
        />
      </div>
      <div>
        <span className={labelClassName()}>Typische Reisedauer</span>
        <SegmentedControl<TripDuration>
          options={[
            { value: "weekend", label: "Wochenende" },
            { value: "week", label: "1 Woche" },
            { value: "extended", label: "Länger" },
            { value: "permanent", label: "Dauer" },
          ]}
          value={tb.tripDuration}
          onChange={(tripDuration) => setTravelBehavior({ tripDuration })}
        />
      </div>
      <div>
        <span className={labelClassName()}>Winter-Region (Faustregel)</span>
        <SegmentedControl<WinterLocation>
          options={[
            { value: "germany", label: "DE / mitte" },
            { value: "scandinavia", label: "Norden" },
            { value: "southern", label: "Süden" },
            { value: "eastern", label: "Osten" },
            { value: "varies", label: "Wechselnd" },
          ]}
          value={tb.winterLocation}
          onChange={(winterLocation) => setTravelBehavior({ winterLocation })}
        />
      </div>
      <div>
        <span className={labelClassName()}>Standzeit ohne Fahren</span>
        <SegmentedControl<StandingDuration>
          options={[
            { value: "short", label: "Kurz" },
            { value: "medium", label: "Mittel" },
            { value: "long", label: "Lang" },
          ]}
          value={tb.standingDuration}
          onChange={(standingDuration) => setTravelBehavior({ standingDuration })}
        />
      </div>
    </div>
  );
}
