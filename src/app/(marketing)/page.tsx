import Link from "next/link";

import { FoundationShowcase } from "@/components/marketing/foundation-showcase";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { SiteHeader } from "@/components/layout/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:shadow-lg motion-reduce:transition-none"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader>
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-foreground transition duration-200 ease-out hover:text-primary"
        >
          PowerSetup
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium" aria-label="Hauptnavigation">
          <Link
            className="cursor-pointer rounded-xl px-3 py-2.5 text-muted-foreground transition duration-200 ease-out hover:bg-accent/60 hover:text-foreground min-h-11 inline-flex items-center"
            href="/wizard/1"
          >
            Wizard
          </Link>
          <Link
            className="cursor-pointer rounded-xl px-3 py-2.5 text-muted-foreground transition duration-200 ease-out hover:bg-accent/60 hover:text-foreground min-h-11 inline-flex items-center"
            href="/admin"
          >
            Admin
          </Link>
        </nav>
      </SiteHeader>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 lg:gap-16 lg:py-14"
      >
        <MarketingHero />
        <FoundationShowcase />
      </main>
    </div>
  );
}
