"use client";

import { useEffect, useMemo } from "react";

import { CardSelection } from "@/components/ui/card-selection";
import { wizardCallout, wizardFormSection, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/store/wizard";

import {
  SECTION_DURATION,
  SECTION_SEASON,
  SECTION_STANDING,
  SECTION_WINTER,
  SEASON_CARDS,
  STANDING_ALTERNATOR_HINT,
  STANDING_CARDS,
  tripDurationCards,
  WINTER_CARDS,
} from "./travel-options";

const ID_SEASON = "step4-travel-season";
const ID_DURATION = "step4-travel-duration";
const ID_WINTER = "step4-travel-winter";
const ID_STANDING = "step4-travel-standing";

export function Step4Travel() {
  const tb = useWizardStore((s) => s.input.travelBehavior);
  const energySources = useWizardStore((s) => s.input.energySources);
  const setTravelBehavior = useWizardStore((s) => s.setTravelBehavior);

  const hasAlternator = energySources.includes("alternator");
  const showWinterSection = tb.season !== "summer";
  const permanentDisabled = tb.season !== "all_year";

  const durationOptions = useMemo(
    () => tripDurationCards(permanentDisabled),
    [permanentDisabled],
  );

  useEffect(() => {
    if (permanentDisabled && tb.tripDuration === "permanent") {
      setTravelBehavior({ tripDuration: "extended" });
    }
  }, [permanentDisabled, tb.tripDuration, setTravelBehavior]);

  return (
    <div className="flex flex-col gap-10">
      <section className={wizardFormSection()} aria-labelledby={ID_SEASON}>
        <h3 id={ID_SEASON} className={wizardSectionLabel()}>
          {SECTION_SEASON}
        </h3>
        <CardSelection
          labelId={ID_SEASON}
          options={SEASON_CARDS}
          value={tb.season}
          onChange={(season) => setTravelBehavior({ season })}
          columns={3}
        />
      </section>

      <section className={wizardFormSection()} aria-labelledby={ID_DURATION}>
        <h3 id={ID_DURATION} className={wizardSectionLabel()}>
          {SECTION_DURATION}
        </h3>
        <CardSelection
          labelId={ID_DURATION}
          options={durationOptions}
          value={tb.tripDuration}
          onChange={(tripDuration) => setTravelBehavior({ tripDuration })}
          columns={2}
        />
      </section>

      {showWinterSection ? (
        <section
          className={cn(wizardFormSection(), "animate-in fade-in slide-in-from-top-2 duration-300")}
          aria-labelledby={ID_WINTER}
        >
          <h3 id={ID_WINTER} className={wizardSectionLabel()}>
            {SECTION_WINTER}
          </h3>
          <CardSelection
            labelId={ID_WINTER}
            options={WINTER_CARDS}
            value={tb.winterLocation}
            onChange={(winterLocation) => setTravelBehavior({ winterLocation })}
            columns={2}
          />
        </section>
      ) : null}

      {hasAlternator ? (
        <section
          className={cn(wizardFormSection(), "animate-in fade-in slide-in-from-top-2 duration-300")}
          aria-labelledby={ID_STANDING}
        >
          <h3 id={ID_STANDING} className={wizardSectionLabel()}>
            {SECTION_STANDING}
          </h3>
          <CardSelection
            labelId={ID_STANDING}
            options={STANDING_CARDS}
            value={tb.standingDuration}
            onChange={(standingDuration) => setTravelBehavior({ standingDuration })}
            columns={3}
          />
          <p className={wizardCallout()}>{STANDING_ALTERNATOR_HINT}</p>
        </section>
      ) : null}
    </div>
  );
}
