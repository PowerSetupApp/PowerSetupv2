import { type ReactNode } from "react";
import { redirect } from "next/navigation";

import { WizardLayoutClient } from "@/components/wizard/wizard-layout-client";
import { wizardStepFromParam } from "@/lib/wizard/wizard-step-from-param";

/** Cache Components: bekannte Schritte für Prerender / stabiles `await params` im Layout. */
export function generateStaticParams() {
  return Array.from({ length: 8 }, (_, i) => ({ step: String(i + 1) }));
}

/** `step` aus dem Server-Layout — kein `useParams` im Shell-Client (vermeidet Suspense-Remount der ProgressBar). */
export default async function WizardStepLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ step: string }>;
}) {
  const { step: raw } = await params;
  const parsed = wizardStepFromParam(raw);
  if (parsed === null) {
    redirect("/wizard/1");
  }

  return <WizardLayoutClient step={parsed}>{children}</WizardLayoutClient>;
}
