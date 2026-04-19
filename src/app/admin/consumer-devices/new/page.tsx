import Link from "next/link";
import { Suspense } from "react";

import { AdminConsumerDeviceForm } from "@/components/admin/admin-consumer-device-form";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { StreamingFallback } from "@/components/streaming-fallback";
import { listAdminConsumerCategories } from "@/lib/db/queries/admin-catalog-read";

export default function AdminConsumerDeviceNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Neues Verbrauchergerät</h1>
        <p className="mt-2 text-sm text-muted-foreground">Wizard-Gerät mit Default-Leistung und Laufzeit.</p>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const res = await listAdminConsumerCategories();

  if (!res.ok) return <AdminDbUnavailableBanner message={res.message} />;

  if (res.data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 p-6 text-sm">
        <p className="text-muted-foreground">
          Es gibt noch keine Verbraucher-Kategorie. Lege zuerst eine Kategorie an.
        </p>
        <Button asChild className="mt-3">
          <Link href="/admin/consumer-categories/new">+ Neue Kategorie</Link>
        </Button>
      </div>
    );
  }

  const cats = res.data.map((c) => ({ id: c.id, name: c.name }));
  return <AdminConsumerDeviceForm categories={cats} />;
}
