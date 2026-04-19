import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCategoryFilterEditor } from "@/components/admin/admin-category-filter-editor";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { StreamingFallback } from "@/components/streaming-fallback";
import { Button } from "@/components/ui/button";
import { getAdminCategoryForEditorById } from "@/lib/db/queries/admin-catalog-read";

type PageProps = { params: Promise<{ id: string }> };

export default function AdminCategoryEditPage(props: PageProps) {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps) {
  const { id } = await params;
  const res = await getAdminCategoryForEditorById(id);

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <AdminDbUnavailableBanner message={res.message} />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/categories">Zurück</Link>
        </Button>
      </div>
    );
  }
  if (!res.data) notFound();

  const { id: categoryId, name, slug, icon, sortOrder, filters } = res.data;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Produktkategorie bearbeiten</h1>
          <p className="mt-1 text-sm text-muted-foreground">{name}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/categories">Zur Liste</Link>
        </Button>
      </div>

      <AdminCategoryForm initial={{ id: categoryId, name, slug, icon, sortOrder }} />

      <AdminCategoryFilterEditor categoryId={categoryId} initial={filters} />
    </div>
  );
}
