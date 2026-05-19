"use client";

import { wizardInsetPanel, wizardSectionLabel } from "@/components/wizard/wizard-surfaces";
import { cn } from "@/lib/utils";
import type { SolarWiringRecommendation } from "@/lib/recommendation/wiring/types";

function warningText(w: SolarWiringRecommendation["warnings"][number]): string {
  switch (w.kind) {
    case "mppt-voltage-exceeded":
      return `MPPT-Eingang zu niedrig: Kälte-Leerlauf bis ca. ${Math.round(w.required * 10) / 10} V nötig, Regler erlaubt max. ${Math.round(w.available * 10) / 10} V.`;
    case "module-count-not-divisible":
      return `Modulanzahl lässt sich nicht sinnvoll in Reihen aufteilen — sinnvoll z. B. ${w.suggested} Module (${w.suggested / 2}×2 oder ähnlich).`;
    case "parallel-current-high":
      return `Hoher Parallel-Strom (ca. ${Math.round(w.currentA * 10) / 10} A) für ${w.cableMm2} mm² PV-Leitung — dickeres Kabel oder mehr Module in Reihe prüfen.`;
    default:
      return "";
  }
}

export function Step8WiringCard({ wiring }: { wiring: SolarWiringRecommendation }) {
  const rationaleLine =
    wiring.rationale === "kein-feasible"
      ? "Mit dem gewählten Katalog-MPPT ist keine zulässige Reihenschaltung möglich."
      : `Laderegler bis ca. ${Math.round(wiring.mpptMaxInputV)} V PV-Eingang — MPP-String ca. ${Math.round(wiring.arrayVoltageVmppV)} V, Kälte-Leerlauf ca. ${Math.round(wiring.arrayVoltageVocColdV * 10) / 10} V (mit Reserve).`;

  return (
    <section className="flex flex-col gap-4">
      <span className={wizardSectionLabel()}>PV-Verschaltung (Katalog)</span>
      <div className={cn(wizardInsetPanel(), "flex flex-col gap-2 text-sm")}>
        <p>
          <span className="font-semibold text-foreground">Verschaltung: </span>
          <span className="text-foreground">{wiring.description}</span>
        </p>
        <p className="text-muted-foreground">{rationaleLine}</p>
        {wiring.warnings.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {wiring.warnings.map((w, i) => (
              <li
                key={`${w.kind}-${i}`}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-sm",
                  w.kind === "mppt-voltage-exceeded"
                    ? "border-destructive/60 bg-destructive/10 text-destructive"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100",
                )}
              >
                {warningText(w)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
