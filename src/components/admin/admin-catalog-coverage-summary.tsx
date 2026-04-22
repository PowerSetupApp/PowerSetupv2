"use client";

import type { CatalogComponentDimensionStats } from "@/lib/db/queries/admin-catalog-component-stats";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function MiniTable({ title, unit, rows }: { title: string; unit: string; rows: { value: number; count: number }[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Keine aktiven Produkte mit Wert.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="pb-1 font-normal">{unit}</th>
            <th className="pb-1 font-normal text-right">Anz.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.value} className="border-t border-border/40">
              <td className="py-1 tabular-nums">{r.value}</td>
              <td className="py-1 text-right tabular-nums">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminCatalogCoverageSummary({ stats }: { stats: CatalogComponentDimensionStats }) {
  const gapTotal =
    stats.inverters.missingPowerW +
    stats.chargersDc.missingCurrentA +
    stats.solarControllers.missingCurrentA +
    stats.cables.missingCrossSectionInCableCategories;

  const distinctLabel = [
    `${stats.inverters.rows.length} WR-W`,
    `${stats.chargersDc.rows.length} Lade-A`,
    `${stats.solarControllers.rows.length} Solar-A`,
    `${stats.cables.rows.length} mm²`,
  ].join(" · ");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Katalogabdeckung:</span> {distinctLabel}
        {gapTotal > 0 ? (
          <span
            className="ml-2 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-100"
            title="Nur aktive Produkte: Summe aus fehlendem powerW (WR), currentA (Shore-Charger/Solar), crossSectionMm2 (Kabel). Nicht dasselbe wie CategoryFilter JSON."
          >
            {gapTotal} ohne Spec
          </span>
        ) : null}
      </p>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 text-xs">
            Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Katalogabdeckung</DialogTitle>
            <DialogDescription>
              Aktive Produkte nach Spec-Feldern (read-only). Lücken = passende Kategorie, aber Feld leer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <MiniTable title="Wechselrichter (W)" unit="W" rows={stats.inverters.rows} />
            <MiniTable title="Batterieladegerät DC (A)" unit="A" rows={stats.chargersDc.rows} />
            <MiniTable title="Solar-Laderegler (A)" unit="A" rows={stats.solarControllers.rows} />
            <MiniTable title="Kabel Querschnitt (mm²)" unit="mm²" rows={stats.cables.rows} />
          </div>
          <ul className="mt-2 space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <li>
              WR-Kategorie: {stats.inverters.activeInCategory} aktiv, {stats.inverters.missingPowerW} ohne{" "}
              <code className="text-foreground">powerW</code>
            </li>
            <li>
              Shore-Charger (ohne Solar-Slug): {stats.chargersDc.activeInCategory} Zeilen,{" "}
              {stats.chargersDc.missingCurrentA} ohne <code className="text-foreground">currentA</code>
            </li>
            <li>
              Solar/MPPT: {stats.solarControllers.activeInCategory} aktiv, {stats.solarControllers.missingCurrentA} ohne{" "}
              <code className="text-foreground">currentA</code>
            </li>
            <li>
              Produkte mit Querschnitt: {stats.cables.activeWithCrossSection} · Kabel-Kategorien ohne mm²:{" "}
              {stats.cables.missingCrossSectionInCableCategories}
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
