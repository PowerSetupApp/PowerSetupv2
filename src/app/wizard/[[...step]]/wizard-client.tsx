"use client";

import { useRouter } from "next/navigation";

import type { WizardConsumerTemplate } from "@/lib/db/wizard-consumer-templates";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { WizardStepBody } from "@/components/wizard/wizard-step-body";

export interface WizardClientProps {
  step: number;
  consumerTemplates: WizardConsumerTemplate[];
}

export function WizardClient({ step, consumerTemplates }: WizardClientProps) {
  const router = useRouter();

  const go = (next: number) => {
    router.push(`/wizard/${next}`);
  };

  return (
    <WizardShell step={step} onStepChange={go}>
      <WizardStepBody step={step} consumerTemplates={consumerTemplates} />
    </WizardShell>
  );
}
