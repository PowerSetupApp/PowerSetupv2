import Link from "next/link";

export default function WizardPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Wizard</h1>
      <p className="text-muted-foreground">
        Acht Schritte, Zustand und Validierung folgen in Phase 3 (PS-1). Die UI-Bausteine sind auf der{" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/">
          Startseite
        </Link>{" "}
        demonstriert.
      </p>
    </div>
  );
}
