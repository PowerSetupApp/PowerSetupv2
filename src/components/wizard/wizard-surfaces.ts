import { cn } from "@/lib/utils";

/** Shared border/background for bounded regions inside a step (shell `main` is the primary card). */
const wizardInsetSurface = "rounded-xl border border-border/60 bg-muted/15";

/**
 * Wizard step surfaces — use instead of stacking `rounded-2xl border` boxes.
 *
 * - `wizardCallout` — short hints / disclaimers (left accent, no full frame).
 * - `wizardSectionLabel` — Zwischenüberschrift über Formabschnitten (~1rem / --text-base, kein All-Caps).
 * - `wizardFormSection` — vertikaler Rhythmus (flex gap) für Überschrift + Felder ohne Margin-Collapse.
 * - `wizardScrollRegion` — one scrollable list panel (single border).
 * - `wizardCatalogScrollRegion` — like scroll region, leicht primary-getönt (Katalog vs. eigene Einträge).
 * - `wizardInsetPanel` — same chrome as scroll region, for static grouped controls (no max-height).
 */
export function wizardCallout(className?: string) {
  return cn(
    "rounded-r-md border-l-[3px] border-amber-500/30 bg-amber-50/80 py-2.5 pl-3 pr-2 text-sm leading-relaxed text-fg-2 sm:pl-4 dark:border-amber-500/40 dark:bg-amber-500/10",
    className,
  );
}

/**
 * Klasse `wizard-section-heading` bricht globales `h3 { font-size: var(--text-xl) }` (globals.css) — Fließtext-Größe ~1rem.
 * Kein `margin-bottom`: Abstand nach unten über `wizardFormSection()` oder Parent-`gap-*`, damit kein Margin-Collapse mit `space-y-*`.
 */
export function wizardSectionLabel(className?: string) {
  return cn(
    "wizard-section-heading mb-0 block text-base font-semibold leading-snug tracking-tight text-fg-1",
    className,
  );
}

/** Form-Abschnitt: Überschrift + Hilfstext + Controls — festes vertikales gap (kein Collapse wie bei `space-y-*`). */
export function wizardFormSection(className?: string) {
  return cn("flex flex-col gap-5", className);
}

export function wizardScrollRegion(className?: string) {
  return cn(
    wizardInsetSurface,
    "max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain pr-0.5",
    className,
  );
}

/** Scroll-Panel für Katalog-Vorschläge — optisch getrennt von „eigenen“ Listen (z. B. Verbraucher-Karten). */
export function wizardCatalogScrollRegion(className?: string) {
  return cn(
    "max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain rounded-xl border border-primary/25 bg-primary/[0.07] pr-0.5 shadow-sm dark:border-primary/35 dark:bg-primary/[0.11]",
    className,
  );
}

export function wizardInsetPanel(className?: string) {
  return cn(wizardInsetSurface, "p-4 sm:p-5", className);
}
