"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { WizardShell } from "./wizard-shell";
import { WizardStepTransition } from "./wizard-step-transition";

export interface WizardLayoutClientProps {
  step: number;
  children: ReactNode;
}

export function WizardLayoutClient({ step, children }: WizardLayoutClientProps) {
  const router = useRouter();

  const go = (next: number) => {
    router.push(`/wizard/${next}`);
  };

  return (
    <WizardShell step={step} onStepChange={go}>
      <WizardStepTransition step={step}>{children}</WizardStepTransition>
    </WizardShell>
  );
}
