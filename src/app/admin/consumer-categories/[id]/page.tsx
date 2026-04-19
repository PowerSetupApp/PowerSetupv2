import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AdminConsumerCategoryForm } from "@/components/admin/admin-consumer-category-form";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { StreamingFallback } from "@/components/streaming-fallback";
import { getAdminConsumerCategoryForEditorById } from "@/lib/db/queries/admin-catalog-read";

type PageProps = { params: Promise<{ id: string }> };

export default function AdminConsumerCategoryEditPage(props: PageProps) {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps) {
  const { id } = await params;
  const res = await getAdminConsumerCategoryForEditorById(id);

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <AdminDbUnavailableBanner message={res.message} />
      </div>
    );
  }
  if (!res.data) notFound();

  const data = res.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/consumer-categories" aria-label="Zurück">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Verbraucher-Kategorie</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.name}</p>
        </div>
      </div>

      <AdminConsumerCategoryForm
        initial={{ id: data.id, name: data.name, slug: data.slug, icon: data.icon, sortOrder: data.sortOrder }}
      />
    </div>
  );
}
