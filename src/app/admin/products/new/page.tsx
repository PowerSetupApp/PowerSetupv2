import { Suspense } from "react";
import Link from "next/link";

import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { AdminProductCreateForm } from "@/components/admin/admin-product-create-form";
import { StreamingFallback } from "@/components/streaming-fallback";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/lib/db/client";
import { readFromDatabase } from "@/lib/db/prisma-errors";
import {
  listAdminCategoryFiltersByCategoryId,
  listAdminProductCategoriesForSelect,
} from "@/lib/db/queries/admin-catalog-read";

export default function AdminProductNewPage() {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <Body />
    </Suspense>
  );
}

async function loadBrands() {
  return readFromDatabase(async () => {
    const prisma = getPrisma();
    return prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
}

async function Body() {
  const [categoriesRes, brandsRes] = await Promise.all([listAdminProductCategoriesForSelect(), loadBrands()]);
  if (!categoriesRes.ok || !brandsRes.ok) {
    const msg = !categoriesRes.ok ? categoriesRes.message : (brandsRes as { ok: false; message: string }).message;
    return (
      <div className="space-y-4">
        <AdminDbUnavailableBanner message={msg} />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">Zurück zu Produkten</Link>
        </Button>
      </div>
    );
  }
  if (categoriesRes.data.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Es existiert noch keine Kategorie. Lege zuerst unter{" "}
          <Link className="underline" href="/admin/categories/new">
            Kategorien
          </Link>{" "}
          eine an.
        </p>
      </div>
    );
  }

  const initialCategoryId = categoriesRes.data[0].id;
  const filtersRes = await listAdminCategoryFiltersByCategoryId(initialCategoryId);
  const initialFilters = filtersRes.ok ? filtersRes.data : [];

  return (
    <AdminProductCreateForm
      categories={categoriesRes.data.map((c) => ({ id: c.id, name: c.name }))}
      brands={brandsRes.data}
      initialCategoryId={initialCategoryId}
      initialFilters={initialFilters}
    />
  );
}
