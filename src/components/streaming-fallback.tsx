/** Generischer Suspense-Fallback für async Server-Inhalte (`cacheComponents`). */
export function StreamingFallback() {
  return (
    <div
      className="space-y-4 rounded-2xl border border-border/60 bg-muted/15 p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted/80" />
      <div className="h-4 w-3/4 max-w-md animate-pulse rounded-md bg-muted" />
    </div>
  );
}
