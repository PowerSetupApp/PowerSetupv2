import Link from "next/link";
import { FoundationShowcase } from "@/components/marketing/foundation-showcase";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lg font-semibold tracking-tight">PowerSetup</span>
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
            <Link className="hover:text-foreground" href="/wizard">
              Wizard
            </Link>
            <Link className="hover:text-foreground" href="/admin">
              Admin
            </Link>
          </nav>
        </div>
      </header>
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
