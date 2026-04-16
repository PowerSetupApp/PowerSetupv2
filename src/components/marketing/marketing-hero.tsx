import Link from "next/link";

import { Button } from "@/components/ui/button";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_-24px_color-mix(in_oklch,var(--foreground)_18%,transparent)] backdrop-blur-sm sm:p-10">
      <div
        className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-primary/15 blur-2xl motion-reduce:opacity-0"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-cta/20 blur-2xl motion-reduce:opacity-0"
        aria-hidden
      />
      <div className="relative grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end">
        <div className="motion-safe:fade-up space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Camping · 12–48 V</p>
          <h1 className="font-display text-[clamp(2rem,6vw,3.25rem)] font-normal leading-[1.08] tracking-tight text-foreground">
            Dein Bordstrom.
            <span className="block text-muted-foreground">Ohne Rätselraten.</span>
          </h1>
          <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">
            Acht klare Schritte, durchdachte Berechnung und später passende Komponenten — mobil gedacht, damit du unterwegs planen kannst.
          </p>
        </div>
        <div className="motion-safe:fade-up motion-safe:fade-up-delay-1 flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-stretch">
          <Button
            asChild
            size="lg"
            className="h-12 min-h-12 rounded-2xl bg-cta px-6 text-base font-semibold text-cta-foreground shadow-sm transition duration-200 ease-out hover:bg-cta/90"
          >
            <Link href="/wizard/1">Planung starten</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 min-h-12 rounded-2xl border-border/80 text-base transition duration-200 ease-out">
            <Link href="/admin">Admin</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
