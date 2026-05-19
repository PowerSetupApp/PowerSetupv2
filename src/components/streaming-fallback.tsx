import { LoadingIndicator } from "@/components/ui/loading-indicator";

/** Generischer Suspense-Fallback für async Server-Inhalte (`cacheComponents`). */
export function StreamingFallback() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-muted/15 p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingIndicator className="py-6" label="Inhalt wird geladen …" />
    </div>
  );
}
