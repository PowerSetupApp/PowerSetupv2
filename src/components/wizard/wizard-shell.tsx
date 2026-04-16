"use client";

import Link from "next/link";

import { ProgressSteps } from "@/components/ui/progress-steps";
import { SiteHeader } from "@/components/layout/site-header";
import {
  canNavigateToStep,
  completedWizardStepIds,
  validateWizardStep,
} from "@/lib/wizard/validation";
import { useWizardStore } from "@/store/wizard";

import { WIZARD_STEPS } from "./wizard-constants";
import { WizardNavBar } from "./wizard-nav-bar";

export interface WizardShellProps {
  step: number;
  children: React.ReactNode;
  onStepChange: (next: number) => void;
}

export function WizardShell({ step, children, onStepChange }: WizardShellProps) {
  const input = useWizardStore((s) => s.input);
  const completed = completedWizardStepIds(step, input);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader>
        <span className="text-base font-semibold text-foreground">Wizard</span>
        <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
          Zurück
        </Link>
      </SiteHeader>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8 pb-28 sm:pb-10">
        <ProgressSteps
          steps={WIZARD_STEPS}
          currentStep={step}
          completedSteps={completed}
          onStepClick={(id) => {
            if (canNavigateToStep(id, step, input)) onStepChange(id);
          }}
          className="shrink-0"
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
        <WizardNavBar
          canBack={step > 1}
          canNext={step < 8 && validateWizardStep(step, input)}
          onBack={() => onStepChange(step - 1)}
          onNext={() => onStepChange(step + 1)}
          nextLabel={step === 7 ? "Zur Übersicht" : "Weiter"}
        />
      </div>
    </div>
  );
}
