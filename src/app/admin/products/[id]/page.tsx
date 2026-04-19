import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StreamingFallback } from "@/components/streaming-fallback";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { AdminProductEditForm } from "@/components/admin/admin-product-edit-form";
import { Button } from "@/components/ui/button";
import { getAdminProductForEditorById } from "@/lib/db/queries/admin-catalog-read";

type PageProps = { params: Promise<{ id: string }> };

export default function AdminProductEditPage(props: PageProps) {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <AdminProductEditPageInner {...props} />
    </Suspense>
  );
}

async function AdminProductEditPageInner({ params }: PageProps) {
  const { id } = await params;
  const res = await getAdminProductForEditorById(id);

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <AdminDbUnavailableBanner message={res.message} />
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">Zurück zu Produkten</Link>
        </Button>
      </div>
    );
  }

  if (!res.data) {
    notFound();
  }

  return <AdminProductEditForm initial={res.data} />;
}
