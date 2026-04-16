import Link from "next/link";
import { FoundationShowcase } from "@/components/marketing/foundation-showcase";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader>
        <span className="text-lg font-semibold tracking-tight text-foreground">PowerSetup</span>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
          <Link className="hover:text-foreground" href="/wizard/1">
            Wizard
          </Link>
          <Link className="hover:text-foreground" href="/admin">
            Admin
          </Link>
        </nav>
      </SiteHeader>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-8 sm:max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Camping-Elektrik planen
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acht Schritte, Berechnung, Produktempfehlungen und Schaltplan — mobil zuerst.
          </p>
        </div>
        <FoundationShowcase />
      </main>
    </div>
  );
}
