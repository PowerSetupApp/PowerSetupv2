"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import { formatAdminDateTime, formatAdminPriceEUR } from "@/lib/admin/format-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminProductPreviewRow } from "@/lib/db/queries/admin-catalog-read";

type Props = {
  loading: boolean;
  errorMessage: string | null;
  data: AdminProductPreviewRow | null;
};

function PreviewDl({
  rows,
}: {
  rows: { term: string; description: ReactNode; mono?: boolean }[];
}) {
  return (
    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,10rem)_1fr]">
      {rows.map((row) => (
        <Fragment key={row.term}>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase sm:pt-0.5">{row.term}</dt>
          <dd
            className={
              row.mono
                ? "font-mono text-xs leading-relaxed text-foreground break-all sm:text-sm"
                : "text-sm font-medium leading-relaxed text-foreground break-words"
            }
          >
            {row.description}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function AdminProductPreviewPanel({ loading, errorMessage, data }: Props) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Lade Daten…</p>;
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Produkt nicht gefunden.</p>;
  }

  const updated = formatAdminDateTime(new Date(data.updatedAt));

  const coreRows: { term: string; description: ReactNode; mono?: boolean }[] = [
    { term: "Name", description: data.name },
    { term: "Kategorie", description: data.categoryName },
    { term: "Preis", description: formatAdminPriceEUR(data.price) },
    { term: "Status", description: data.isActive ? "Aktiv" : "Inaktiv" },
    { term: "Aktualisiert", description: <span className="font-normal text-muted-foreground">{updated}</span> },
  ];
  if (data.icon) coreRows.push({ term: "Icon", description: data.icon });
  if (data.asin) coreRows.push({ term: "ASIN", description: data.asin, mono: true });

  const definedFilterRows = data.filterRows.filter((r) => r.origin === "defined");
  const extraFilterRows = data.filterRows.filter((r) => r.origin === "extra");
  const hasBrandOrFilters =
    data.brandName !== null || definedFilterRows.length > 0 || extraFilterRows.length > 0;

  return (
    <div className="space-y-4 text-sm">
      {data.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- externe Medien-URLs
        <img
          src={data.imageUrl}
          alt=""
          className="mx-auto max-h-40 rounded-xl border border-border/60 bg-muted/20 object-contain shadow-sm"
        />
      ) : null}

      <Card className="border-border/70 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Stammdaten</CardTitle>
          <CardDescription>Name, Kategorie und Status</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PreviewDl rows={coreRows} />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filter-Werte</CardTitle>
          <CardDescription>
            Katalog-Filter nach Kategorie-Definition. Zusatzfelder stammen aus älteren Importen oder Rohdaten, wenn
            kein passender Filter in dieser Kategorie existiert — sie sind trotzdem für Auswertungen gespeichert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {!hasBrandOrFilters ? (
            <p className="text-sm text-muted-foreground">Keine Filter-Werte hinterlegt.</p>
          ) : (
            <>
              <div className="rounded-lg border border-border/50 bg-muted/15 p-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Marke</p>
                <p className="text-sm font-semibold text-foreground">{data.brandName ?? "Keine Marke"}</p>
              </div>

              {definedFilterRows.length > 0 ? (
                <div>
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Kategorie-Filter
                  </p>
                  <PreviewDl
                    rows={definedFilterRows.map((r) => ({
                      term: r.label,
                      description: r.value,
                    }))}
                  />
                </div>
              ) : null}

              {extraFilterRows.length > 0 ? (
                <div className="border-t border-border/50 pt-4">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Zusatzfelder
                  </p>
                  <p className="mb-3 text-xs leading-snug text-muted-foreground">
                    Diese Keys gibt es nur in den gespeicherten JSON-Daten, nicht in der aktuellen Filter-Definition der
                    Kategorie. Bezeichnungen sind ggf. technische Namen oder eine deutsche Zuordnung, wo vorhanden.
                  </p>
                  <PreviewDl
                    rows={extraFilterRows.map((r) => ({
                      term: r.label,
                      description: r.value,
                    }))}
                  />
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {data.description ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Beschreibung</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{data.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {data.affiliateUrl ? (
        <p>
          <Link
            href={data.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Bei Amazon ansehen
          </Link>
        </p>
      ) : null}

      {data.specsExcerpt ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spezifikationen</CardTitle>
            <CardDescription>Auszug aus den technischen Daten</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/25 p-3 font-mono text-xs leading-relaxed">
              {data.specsExcerpt}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
