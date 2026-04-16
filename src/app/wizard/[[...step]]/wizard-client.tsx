"use client";

import { useRouter } from "next/navigation";

import { WizardShell } from "@/components/wizard/wizard-shell";
import { WizardStepBody } from "@/components/wizard/wizard-step-body";

export interface WizardClientProps {
  step: number;
}

export function WizardClient({ step }: WizardClientProps) {
  const router = useRouter();

  const go = (next: number) => {
    router.push(`/wizard/${next}`);
  };

  return (
    <WizardShell step={step} onStepChange={go}>
      <WizardStepBody step={step} />
    </WizardShell>
  );
}
