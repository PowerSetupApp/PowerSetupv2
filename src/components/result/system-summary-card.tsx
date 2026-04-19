import type { AlgorithmOutput } from "@/lib/algorithm/types";

export interface SystemSummaryCardProps {
  calculations: AlgorithmOutput;
}

function batteryTypeLabel(t: AlgorithmOutput["battery"]["type"]): string {
  if (t === "lifepo4") return "LiFePO4";
  return t.toUpperCase();
}

export function SystemSummaryCard({ calculations }: SystemSummaryCardProps) {
  const { battery, solar } = calculations;

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/15 p-5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Systemüberblick</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dimensionierung aus deinen Eingaben — Verbrauch und empfohlene Speicher-/Solargröße.
      </p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Tagesverbrauch</dt>
          <dd className="font-semibold text-foreground">{Math.round(battery.dailyWh)} Wh</dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Batterie (Ziel)</dt>
          <dd className="font-semibold text-foreground">
            ca. {battery.recommendedCapacityAh} Ah · {batteryTypeLabel(battery.type)}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Solar</dt>
          <dd className="font-semibold text-foreground">
            {solar.needed ? `mind. ca. ${solar.requiredWp} Wp` : "nicht erforderlich"}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">Autarkie (Ziel)</dt>
          <dd className="font-semibold text-foreground">
            {battery.autarchyDays >= 900 ? "Maximum" : `ca. ${Math.round(battery.autarchyDays)} Tage`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
