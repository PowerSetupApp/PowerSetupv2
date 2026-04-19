import { Suspense } from "react";
import Link from "next/link";

import { StreamingFallback } from "@/components/streaming-fallback";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { AdminProductCategoriesTable } from "@/components/admin/admin-products-and-categories-tables";
import { Button } from "@/components/ui/button";
import { listAdminProductCategories } from "@/lib/db/queries/admin-catalog-read";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Produktkategorien</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kategorien mit Aktionen, Stammdaten &amp; Filter-Definitionen.
          </p>
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/categories/new">+ Neue Kategorie</Link>
        </Button>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminCategoriesBody />
      </Suspense>
    </div>
  );
}

async function AdminCategoriesBody() {
  const categoriesResult = await listAdminProductCategories();

  return (
    <>
      {!categoriesResult.ok ? <AdminDbUnavailableBanner message={categoriesResult.message} /> : null}

      {categoriesResult.ok ? (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{categoriesResult.data.length}</span> Kategorien
          </p>
          {categoriesResult.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Kategorien in der Datenbank.</p>
          ) : (
            <AdminProductCategoriesTable rows={categoriesResult.data} />
          )}
        </>
      ) : null}
    </>
  );
}
