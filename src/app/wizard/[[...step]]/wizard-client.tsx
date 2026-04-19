"use client";

import { useRouter } from "next/navigation";

import type { WizardConsumerTemplate } from "@/lib/db/queries/wizard-consumer-templates";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { WizardStepBody } from "@/components/wizard/wizard-step-body";

export interface WizardClientProps {
  step: number;
  consumerTemplates: WizardConsumerTemplate[];
  /** DB-/Migrationsfehler beim Laden des Katalogs (sonst `null`). */
  consumerCatalogError: string | null;
}

export function WizardClient({ step, consumerTemplates, consumerCatalogError }: WizardClientProps) {
  const router = useRouter();

  const go = (next: number) => {
    router.push(`/wizard/${next}`);
  };

  return (
    <WizardShell step={step} onStepChange={go}>
      <WizardStepBody
        step={step}
        consumerTemplates={consumerTemplates}
        consumerCatalogError={consumerCatalogError}
      />
    </WizardShell>
  );
}
