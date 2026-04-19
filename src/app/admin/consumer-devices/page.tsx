import Link from "next/link";
import { Suspense } from "react";

import { AdminConsumerDevicesTable } from "@/components/admin/admin-brands-and-consumers-tables";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { StreamingFallback } from "@/components/streaming-fallback";
import { listAdminConsumerDevices } from "@/lib/db/queries/admin-catalog-read";

export default function AdminConsumerDevicesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">Verbrauchergeräte</h1>
          <p className="mt-2 text-sm text-muted-foreground">Wizard-Geräte mit Default-Leistung und Laufzeit.</p>
        </div>
        <Button asChild className="shrink-0 self-start">
          <Link href="/admin/consumer-devices/new">+ Neues Gerät</Link>
        </Button>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminConsumerDevicesBody />
      </Suspense>
    </div>
  );
}

async function AdminConsumerDevicesBody() {
  const result = await listAdminConsumerDevices();

  return (
    <>
      {!result.ok ? <AdminDbUnavailableBanner message={result.message} /> : null}

      {result.ok ? (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{result.data.length}</span> Geräte
          </p>
          {result.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Verbrauchergeräte in der Datenbank.</p>
          ) : (
            <AdminConsumerDevicesTable rows={result.data} />
          )}
        </>
      ) : null}
    </>
  );
}
