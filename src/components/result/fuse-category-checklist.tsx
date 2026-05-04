import type { RequiredFuseCategory } from "@/lib/algorithm/types";

export function FuseCategoryChecklist({ items }: { items: readonly RequiredFuseCategory[] }) {
  if (!items.length) return null;

  return (
    <section
      className="rounded-2xl border border-border/70 bg-muted/10 p-5"
      aria-labelledby="fuse-checklist-heading"
    >
      <h2
        id="fuse-checklist-heading"
        className="font-display text-lg font-semibold tracking-tight text-foreground"
      >
        Sicherungstypen (Planung)
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Übersicht, welche Bauformen in deiner Anlage vorkommen können — ohne einzelne
        Nennwerte. Verdrahtung, Anschlussstellen und Ströme legst du im Stromlaufplan fest.
      </p>
      <ul className="mt-4 space-y-4">
        {items.map((c) => (
          <li key={c.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
            <p className="text-sm font-medium text-foreground">{c.familyLabelDe}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.reasonDe}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
