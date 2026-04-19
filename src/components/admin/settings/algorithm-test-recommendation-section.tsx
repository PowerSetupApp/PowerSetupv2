"use client";

import type {
  AlgorithmTestRecommendationPreviewPayload,
  EnrichedPrefilterProduct,
} from "@/lib/admin/algorithm-test-recommendation-preview";
import type { RecommendationBucket } from "@/lib/recommendation/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatProductSpecs(bucket: RecommendationBucket, p: EnrichedPrefilterProduct): string {
  const parts: string[] = [];
  switch (bucket) {
    case "battery":
      if (p.capacityAh != null) parts.push(`${p.capacityAh} Ah`);
      if (p.voltageV != null) parts.push(`${p.voltageV} V`);
      if (p.batteryType) parts.push(String(p.batteryType));
      break;
    case "solar":
      if (p.solarWp != null) parts.push(`${p.solarWp} Wp`);
      break;
    case "inverter":
      if (p.powerW != null) parts.push(`${p.powerW} W`);
      if (p.waveform) parts.push(String(p.waveform));
      break;
    case "controller":
      if (p.currentA != null) parts.push(`${p.currentA} A`);
      break;
    case "cable":
      if (p.crossSectionMm2 != null) parts.push(`${p.crossSectionMm2} mm²`);
      break;
    default:
      if (p.powerW != null) parts.push(`${p.powerW} W`);
      if (p.currentA != null) parts.push(`${p.currentA} A`);
      if (p.capacityAh != null) parts.push(`${p.capacityAh} Ah`);
      if (p.solarWp != null) parts.push(`${p.solarWp} Wp`);
  }
  return parts.length ? parts.join(" · ") : "—";
}

function TargetsBlock({ data }: { data: AlgorithmTestRecommendationPreviewPayload["targets"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Batterie (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.battery.recommendedCapacityAh} Ah · {data.battery.voltage} V · {data.battery.type}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Solar (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.solar.needed
            ? `Bedarf min. ${data.solar.requiredWp} Wp · Dach max. ${data.solar.maxRoofWp} Wp · mobil ${data.solar.portableWp} Wp`
            : "nicht gewählt / nicht nötig"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Wechselrichter (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.inverter.needed
            ? `${data.inverter.recommendedW} W empfohlen · Spitze ${Math.round(data.inverter.peakLoadW)} W`
            : "nicht nötig"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Solarladeregler (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.controller.needed ? `${data.controller.currentA} A · ${data.controller.type}` : "nicht nötig"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Landstrom-Lader (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.charger.needed ? `${data.charger.recommendedCurrentA} A` : "nicht nötig"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Booster (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.booster.needed ? `${data.booster.outputCurrentA} A` : "nicht nötig"}
        </p>
      </div>
      <div className="rounded-lg border border-border/70 bg-background p-3 text-sm sm:col-span-2 xl:col-span-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kabel (Ziel)</p>
        <p className="mt-1 font-semibold text-foreground">
          {data.cable.routes > 0
            ? `${data.cable.routes} Strecken · max. Querschnitt ${data.cable.maxRecommendedCrossSectionMm2} mm²`
            : "keine Strecken"}
        </p>
      </div>
    </div>
  );
}

function BucketTable({ bucket, labelDe, items }: { bucket: RecommendationBucket; labelDe: string; items: EnrichedPrefilterProduct[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{labelDe}</h4>
      <div className="overflow-x-auto rounded-md border border-border/60">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Produkt</th>
              <th className="px-3 py-2 font-medium">Kategorie</th>
              <th className="px-3 py-2 font-medium">Leistung / Daten</th>
              <th className="px-3 py-2 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, i) => (
              <tr key={row.productId} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.categoryName ?? row.categorySlug}</td>
                <td className="px-3 py-2 text-foreground">{formatProductSpecs(bucket, row)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{Math.round(row.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type AlgorithmTestRecommendationSectionProps = {
  data: AlgorithmTestRecommendationPreviewPayload | null;
};

export function AlgorithmTestRecommendationSection({ data }: AlgorithmTestRecommendationSectionProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produkt-Prefilter</CardTitle>
          <CardDescription>Erscheint nach einem erfolgreichen Testlauf.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empfehlungs-Ziele &amp; Produkt-Prefilter</CardTitle>
        <CardDescription>
          Zielwerte stammen aus dem Algorithmus-Output (dieselben Kennzahlen wie in der Produkt-Pipeline). Die Tabellen
          listen die Top-Kandidaten aus dem Prefilter — dieselbe Menge, aus der später die KI wählt (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">runAi: false</code> im Test, keine API-Kosten).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!data.catalogOk ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Produktkatalog konnte nicht geladen werden — Prefilter-Einträge ohne Stammdaten-Spezifikationen.
          </p>
        ) : null}
        <TargetsBlock data={data.targets} />
        {data.buckets.every((b) => b.items.length === 0) ? (
          <p className="text-sm text-muted-foreground">
            Keine Prefilter-Treffer — Katalog leer, keine aktiven Produkte oder keine zur Berechnung passenden
            Kategorien.
          </p>
        ) : (
          <div className="space-y-6">
            {data.buckets.map((b) => (
              <BucketTable key={b.bucket} bucket={b.bucket} labelDe={b.labelDe} items={b.items} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
