import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <a
        href="#admin-main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:shadow-lg motion-reduce:transition-none"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader>
        <span className="font-display text-base tracking-tight text-foreground sm:text-lg">Admin</span>
        <Link
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition duration-200 ease-out hover:bg-accent/60 hover:text-foreground min-h-11 inline-flex items-center"
          href="/"
        >
          Zurück zur Startseite
        </Link>
      </SiteHeader>
      <main id="admin-main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-[0_18px_50px_-30px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Betreiber · Phase 7</p>
          <h1 className="font-display mt-3 text-3xl font-normal tracking-tight text-foreground">Admin-Bereich</h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            Funktionsflächen und CRUD gemäß PS-7 folgen in Phase 7. Diese Route ist per Basic Auth geschützt (
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>, optional{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">ADMIN_USERNAME</code>, Standard{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">admin</code>).
          </p>
        </div>
      </main>
    </div>
  );
}
