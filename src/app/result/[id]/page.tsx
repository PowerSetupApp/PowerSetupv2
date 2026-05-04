import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FuseCategoryChecklist } from "@/components/result/fuse-category-checklist";
import { ProductRecommendationList } from "@/components/result/product-recommendation-list";
import { ResultGenerateRetry } from "@/components/result/result-generate-retry";
import { SchematicSection } from "@/components/result/schematic-section";
import { SystemSummaryCard } from "@/components/result/system-summary-card";
import { StreamingFallback } from "@/components/streaming-fallback";
import { listProductsByIdsForResult } from "@/lib/db/queries/products";
import { getResultByIdForPublic } from "@/lib/db/queries/results";
import { enrichDisplayLinesWithCatalogHints } from "@/lib/results/build-product-display-lines";
import { parseResultViewModel } from "@/lib/results/parse-result-view-model";
import { isResultExpired } from "@/lib/results/result-helpers";

type PageProps = { params: Promise<{ id: string }> };

export default function ResultPage(props: PageProps) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 pb-16">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dein Ergebnis</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Elektrik-Empfehlung
        </h1>
        <p className="text-sm text-muted-foreground">
          Diese Seite ist unter deiner persönlichen URL gespeichert — typischerweise 30 Tage gültig (siehe
          Geschäftsregeln).
        </p>
      </header>

      <Suspense fallback={<StreamingFallback />}>
        <ResultPageBody {...props} />
      </Suspense>
    </main>
  );
}

async function ResultPageBody({ params }: PageProps) {
  const { id } = await params;
  const row = await getResultByIdForPublic(id);
  if (!row) notFound();

  const expired = isResultExpired(row.expiresAt);
  const vm = parseResultViewModel(row);
  const orderedIds = vm.productDisplayLines
    .filter((l) => l.type === "product")
    .map((l) => l.productId);
  const productsResult = await listProductsByIdsForResult(orderedIds);
  const products = productsResult.ok ? productsResult.data : [];
  const displayLines =
    vm.calculations != null
      ? enrichDisplayLinesWithCatalogHints(vm.productDisplayLines, vm.calculations, products)
      : vm.productDisplayLines;
  const ready = !expired && row.generationStatus === "succeeded" && vm.calculations !== null;

  return (
    <>
      {expired ? (
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground">
          Dieses Ergebnis ist abgelaufen. Bitte starte eine neue Planung im Wizard.
        </div>
      ) : null}

      {!expired && !ready ? (
        <ResultGenerateRetry
          resultId={id}
          initialStatus={pickInitialStatus(row.generationStatus)}
          initialError={row.generationError}
        />
      ) : null}

      {ready && vm.calculations ? (
        <>
          {vm.solarWiring?.warnings.some((w) => w.kind === "mppt-voltage-exceeded") ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <p className="font-semibold">PV-Spannung / MPPT</p>
              <p className="mt-1">
                Die gewählte Verschaltung oder der Laderegler passt elektrisch riskant: max. PV-Eingangsspannung
                unterschritten. Bitte MPPT mit höherer max. PV-Spannung oder andere Modul-/String-Konfiguration prüfen.
              </p>
            </div>
          ) : null}
          <SystemSummaryCard calculations={vm.calculations} />
          <FuseCategoryChecklist items={vm.calculations.requiredFuseCategories ?? []} />
          <ProductRecommendationList
            lines={displayLines}
            products={products}
            aiSelections={vm.aiSelections}
            solarWiring={vm.solarWiring}
          />
          <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-muted/25" aria-hidden />}>
            <SchematicSection
              resultId={id}
              creditBalance={row.creditBalance}
              pdfUrl={row.schematicPdfUrl}
              ready={ready}
            />
          </Suspense>
        </>
      ) : null}

      {ready && !vm.calculations ? (
        <div className="rounded-2xl border border-border/70 bg-muted/15 p-6 text-sm text-muted-foreground">
          Gespeicherte Berechnung konnte nicht gelesen werden. Bitte eine neue Planung starten.
        </div>
      ) : null}
    </>
  );
}

function pickInitialStatus(status: "idle" | "pending" | "succeeded" | "failed"): "idle" | "pending" | "failed" {
  if (status === "succeeded") return "pending";
  return status;
}
