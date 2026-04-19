import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AdminConsumerDeviceForm } from "@/components/admin/admin-consumer-device-form";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { StreamingFallback } from "@/components/streaming-fallback";
import {
  getAdminConsumerDeviceForEditorById,
  listAdminConsumerCategories,
} from "@/lib/db/queries/admin-catalog-read";

type PageProps = { params: Promise<{ id: string }> };

export default function AdminConsumerDeviceEditPage(props: PageProps) {
  return (
    <Suspense fallback={<StreamingFallback />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps) {
  const { id } = await params;
  const [deviceRes, catsRes] = await Promise.all([
    getAdminConsumerDeviceForEditorById(id),
    listAdminConsumerCategories(),
  ]);

  if (!deviceRes.ok) return <AdminDbUnavailableBanner message={deviceRes.message} />;
  if (!catsRes.ok) return <AdminDbUnavailableBanner message={catsRes.message} />;
  if (!deviceRes.data) notFound();

  const d = deviceRes.data;
  const cats = catsRes.data.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/consumer-devices" aria-label="Zurück">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Verbrauchergerät</h1>
          <p className="mt-1 text-sm text-muted-foreground">{d.name}</p>
        </div>
      </div>

      <AdminConsumerDeviceForm initial={d} categories={cats} />
    </div>
  );
}
