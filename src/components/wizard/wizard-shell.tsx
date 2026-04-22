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
import { useWizardResultSubmit } from "./use-wizard-result-submit";

export interface WizardShellProps {
  step: number;
  children: React.ReactNode;
  onStepChange: (next: number) => void;
}

export function WizardShell({ step, children, onStepChange }: WizardShellProps) {
  const input = useWizardStore((s) => s.input);
  const completed = completedWizardStepIds(step, input);
  const { submit, pending, error, canSubmit } = useWizardResultSubmit(input);

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <a
        href="#wizard-step-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:shadow-lg motion-reduce:transition-none"
      >
        Zum Schritt-Inhalt springen
      </a>
      <SiteHeader>
        <span className="font-display text-base tracking-tight text-foreground sm:text-lg">Wizard</span>
        <Link
          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition duration-200 ease-out hover:bg-accent/60 hover:text-foreground min-h-11 inline-flex items-center"
          href="/"
        >
          Zurück zur Startseite
        </Link>
      </SiteHeader>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
        <ProgressSteps
          steps={WIZARD_STEPS}
          currentStep={step}
          completedSteps={completed}
          onStepClick={(id) => {
            if (canNavigateToStep(id, step, input)) onStepChange(id);
          }}
          className="shrink-0"
        />
        <main
          id="wizard-step-content"
          className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-30px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-sm sm:p-8"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6">{children}</div>
        </main>
        {step === 8 && error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <WizardNavBar
          canBack={step > 1}
          canNext={
            step === 8
              ? canSubmit && !pending
              : step < 8 && validateWizardStep(step, input)
          }
          onBack={() => onStepChange(step - 1)}
          onNext={step === 8 ? submit : () => onStepChange(step + 1)}
          nextLabel={
            step === 8
              ? pending
                ? "Wird gespeichert …"
                : "Ergebnis speichern & anzeigen"
              : step === 7
                ? "Zur Übersicht"
                : "Weiter"
          }
        />
      </div>
    </div>
  );
}
