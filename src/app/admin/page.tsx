import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader>
        <span className="text-base font-semibold text-foreground">Admin</span>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
          Zurück
        </Link>
      </SiteHeader>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Funktionsflächen und CRUD gemäß PS-7 kommen in Phase 7. Diese Route ist per Basic Auth geschützt (
          <code className="rounded bg-muted px-1 text-sm">ADMIN_PASSWORD</code>, optional{" "}
          <code className="rounded bg-muted px-1 text-sm">ADMIN_USERNAME</code>, Standard{" "}
          <code className="rounded bg-muted px-1 text-sm">admin</code>).
        </p>
      </div>
    </div>
  );
}
