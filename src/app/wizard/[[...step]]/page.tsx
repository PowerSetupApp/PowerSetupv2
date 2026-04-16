import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export default function WizardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader>
        <span className="text-base font-semibold text-foreground">Wizard</span>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
          Zurück
        </Link>
      </SiteHeader>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Wizard</h1>
        <p className="text-muted-foreground">
          Acht Schritte, Zustand und Validierung folgen in Phase 3 (PS-1). Die UI-Bausteine sind auf der{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/">
            Startseite
          </Link>{" "}
          demonstriert.
        </p>
      </div>
    </div>
  );
}
