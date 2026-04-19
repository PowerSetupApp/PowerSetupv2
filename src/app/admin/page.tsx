import { Suspense } from "react";
import Link from "next/link";
import { FileText, FolderTree, Package, Plus } from "lucide-react";

import { StreamingFallback } from "@/components/streaming-fallback";
import { AdminDbUnavailableBanner } from "@/components/admin/admin-db-banner";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/lib/db/queries/admin-dashboard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Übersicht und Schnellaktionen</p>
      </div>

      <Suspense fallback={<StreamingFallback />}>
        <AdminDashboardBody />
      </Suspense>
    </div>
  );
}

async function AdminDashboardBody() {
  const result = await getAdminDashboardStats();

  return (
    <>
      {!result.ok ? <AdminDbUnavailableBanner message={result.message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Package className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produkte</p>
              <p className="mt-1 font-display text-2xl font-normal tabular-nums text-foreground">
                {result.ok ? result.stats.productCount : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {result.ok ? `${result.stats.activeProductCount} aktiv` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <FolderTree className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kategorien</p>
              <p className="mt-1 font-display text-2xl font-normal tabular-nums text-foreground">
                {result.ok ? result.stats.categoryCount : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <FileText className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Results (7 Tage)</p>
              <p className="mt-1 font-display text-2xl font-normal tabular-nums text-foreground">
                {result.ok ? result.stats.resultsLast7Days : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="font-display text-lg font-normal tracking-tight text-foreground">Schnellaktionen</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden />
              Neues Produkt
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/categories">
              <Plus className="size-4" aria-hidden />
              Neue Kategorie
            </Link>
          </Button>
        </div>
      </div>

      <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">ADMIN_PASSWORD</code> schützt{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">/admin</code> per Basic Auth (optional{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">ADMIN_USERNAME</code>, Standard{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">admin</code>). Ohne gesetztes
        Passwort liefert der Proxy 503. Eingebettete Browser (z. B. Cursor) zeigen den Basic-Dialog oft nicht — dann{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">ADMIN_SKIP_BASIC_AUTH_IN_DEV=1</code>{" "}
        nur bei <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">next dev</code> in{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">.env.local</code> oder einen normalen
        Browser nutzen.
      </p>
    </>
  );
}
