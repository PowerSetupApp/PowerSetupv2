import { Suspense } from "react";
import Link from "next/link";

import { StreamingFallback } from "@/components/streaming-fallback";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { AdminProductImportDialog } from "@/components/admin/admin-product-import-dialog";
import { AdminProductsTableSection } from "@/components/admin/admin-products-table-section";
import { Button } from "@/components/ui/button";
import { listAdminProductCategories, listAdminProducts } from "@/lib/db/queries/admin-catalog-read";

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Produkte</h1>
          <p className="mt-2 text-sm text-muted-foreground">Katalog bearbeiten, filtern und mit Amazon verknüpfen.</p>
        </div>
        <Suspense fallback={null}>
          <AdminProductsHeaderActions />
        </Suspense>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminProductsBody />
      </Suspense>
    </div>
  );
}

async function AdminProductsHeaderActions() {
  const categoriesResult = await listAdminProductCategories();
  const cats = categoriesResult.ok ? categoriesResult.data.map((c) => ({ id: c.id, name: c.name })) : [];
  return (
    <div className="flex flex-wrap gap-2 self-start">
      {cats.length > 0 ? <AdminProductImportDialog categories={cats} /> : null}
      <Button asChild className="shrink-0">
        <Link href="/admin/products/new">+ Neues Produkt</Link>
      </Button>
    </div>
  );
}

async function AdminProductsBody() {
  const [productsResult, categoriesResult] = await Promise.all([listAdminProducts(), listAdminProductCategories()]);

  return (
    <>
      {!productsResult.ok ? <AdminDbUnavailableBanner message={productsResult.message} /> : null}
      {!categoriesResult.ok ? <AdminDbUnavailableBanner message={categoriesResult.message} /> : null}

      {productsResult.ok && categoriesResult.ok ? (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{productsResult.data.length}</span> Produkte insgesamt
          </p>
          {productsResult.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Produkte in der Datenbank.</p>
          ) : (
            <AdminProductsTableSection rows={productsResult.data} categories={categoriesResult.data} />
          )}
        </>
      ) : null}
    </>
  );
}
