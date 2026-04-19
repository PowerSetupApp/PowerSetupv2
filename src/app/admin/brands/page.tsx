import { Suspense } from "react";

import { AdminBrandAddDialog } from "@/components/admin/admin-brand-add-dialog";
import { AdminBrandCategoryMapping } from "@/components/admin/admin-brand-category-mapping";
import { AdminBrandsTable } from "@/components/admin/admin-brands-and-consumers-tables";
import { StreamingFallback } from "@/components/streaming-fallback";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { getPrisma } from "@/lib/db/client";
import { readFromDatabase } from "@/lib/db/prisma-errors";
import {
  listAdminBrandFilterCategories,
  listAdminProductCategoriesForSelect,
} from "@/lib/db/queries/admin-catalog-read";

async function loadBrandsWithTypes() {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    const rows = await prisma.brand.findMany({
      select: { id: true, name: true, isActive: true, showInPreferences: true, types: true },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({ ...r, types: r.types ?? [] }));
  });
}

export default function AdminBrandsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Marken</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Marken-Stammdaten und Sichtbarkeit im Wizard; Zuordnung zu Produktkategorien.
          </p>
        </div>
        <div className="shrink-0 self-start">
          <AdminBrandAddDialog />
        </div>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminBrandsBody />
      </Suspense>
    </div>
  );
}

async function AdminBrandsBody() {
  const [brandsRes, mappingRes, categoriesRes] = await Promise.all([
    loadBrandsWithTypes(),
    listAdminBrandFilterCategories(),
    listAdminProductCategoriesForSelect(),
  ]);

  return (
    <div className="space-y-8">
      {!brandsRes.ok ? <AdminDbUnavailableBanner message={brandsRes.message} /> : null}
      {!mappingRes.ok ? <AdminDbUnavailableBanner message={mappingRes.message} /> : null}
      {!categoriesRes.ok ? <AdminDbUnavailableBanner message={categoriesRes.message} /> : null}

      {brandsRes.ok ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-normal tracking-tight text-foreground">Alle Marken</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{brandsRes.data.length}</span> Marken
          </p>
          {brandsRes.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Marken in der Datenbank.</p>
          ) : (
            <AdminBrandsTable rows={brandsRes.data} />
          )}
        </section>
      ) : null}

      {mappingRes.ok && categoriesRes.ok ? (
        <AdminBrandCategoryMapping groups={mappingRes.data} productCategories={categoriesRes.data} />
      ) : null}
    </div>
  );
}
