import Link from "next/link";
import { Suspense } from "react";

import { AdminConsumerCategoriesTable } from "@/components/admin/admin-brands-and-consumers-tables";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { StreamingFallback } from "@/components/streaming-fallback";
import { listAdminConsumerCategories } from "@/lib/db/queries/admin-catalog-read";

export default function AdminConsumerCategoriesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Verbraucher-Kategorien</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gruppen für Verbrauchergeräte im Wizard.</p>
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/consumer-categories/new">+ Neue Kategorie</Link>
        </Button>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminConsumerCategoriesBody />
      </Suspense>
    </div>
  );
}

async function AdminConsumerCategoriesBody() {
  const result = await listAdminConsumerCategories();

  return (
    <>
      {!result.ok ? <AdminDbUnavailableBanner message={result.message} /> : null}

      {result.ok ? (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{result.data.length}</span> Kategorien
          </p>
          {result.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Verbraucher-Kategorien in der Datenbank.</p>
          ) : (
            <AdminConsumerCategoriesTable rows={result.data} />
          )}
        </>
      ) : null}
    </>
  );
}
