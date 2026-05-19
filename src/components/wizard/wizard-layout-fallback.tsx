/** Statischer Fallback ohne `useParams` — für `<Suspense>` um `WizardLayoutClient` (Cache Components). */
export function WizardLayoutFallback() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-bg-1 px-4"
      role="status"
      aria-busy="true"
      aria-label="Wizard wird geladen"
    >
      <span className="sr-only">Wizard wird geladen</span>
      <div
        className="size-10 shrink-0 animate-spin rounded-full border-2 border-amber-500 border-t-transparent motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  );
}
