"use client";

import Link from "next/link";

import { ProgressBar } from "@/components/ui/progress-bar";
import { validateWizardStep } from "@/lib/wizard/validation";
import { useWizardStore } from "@/store/wizard";

import { LiveSummary } from "./live-summary";
import { LiveSummaryDrawer } from "./live-summary-drawer";
import { WIZARD_STEP_META, padWizardStep } from "./wizard-constants";
import { WizardNavBar } from "./wizard-nav-bar";
import { WizardTopBar } from "./wizard-top-bar";
import { useWizardResultSubmit } from "./use-wizard-result-submit";

const shellMax = "mx-auto w-full max-w-[min(100%,var(--wizard-max-width))]";

export interface WizardShellProps {
  step: number;
  children: React.ReactNode;
  onStepChange: (next: number) => void;
}

export function WizardShell({ step, children, onStepChange }: WizardShellProps) {
  const input = useWizardStore((s) => s.input);
  const { submit, pending, error, canSubmit } = useWizardResultSubmit(input);

  const meta = WIZARD_STEP_META[step] ?? WIZARD_STEP_META[1];
  const hasRail = step >= 1 && step <= 8;
  const pct = (step / 8) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-1">
      <a
        href="#wizard-step-content"
        className="sr-only rounded-md bg-amber-400 px-4 py-2 text-charcoal-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:shadow-lg motion-reduce:transition-none"
      >
        Zum Schritt-Inhalt springen
      </a>

      <WizardTopBar step={step} categoryLabel={meta.category} input={input} />
      <ProgressBar pct={pct} />

      <div
        className={`flex min-h-0 flex-1 flex-col min-[1100px]:flex-row min-[1100px]:items-stretch ${shellMax}`}
      >
        <div className="flex min-h-0 flex-1 flex-col px-4 py-6 pb-[calc(5.25rem+env(safe-area-inset-bottom))] min-[1100px]:px-10 min-[1100px]:py-11">
          <div className="w-full max-w-[var(--form-max)]">
            <p className="eyebrow mb-2 !text-lg !text-amber-400">{padWizardStep(step)}</p>
            <h1 className="wizard-step-title font-display tracking-tight text-fg-1">{meta.title}</h1>
            <p className="mt-6 text-pretty text-fg-2 min-[1100px]:mt-8">{meta.subtitle}</p>

            <main id="wizard-step-content" className="mt-8 flex min-h-0 flex-1 flex-col">
              {children}
            </main>

            {step === 8 && error ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <p className="mt-6 hidden text-left text-xs text-fg-3 min-[1100px]:block">
              <Link href="/" className="underline-offset-2 hover:text-fg-2 hover:underline">
                Zurück zur Startseite
              </Link>
            </p>
          </div>
        </div>

        {hasRail ? (
          <aside className="hidden w-[340px] shrink-0 border-l border-border-1 bg-bg-2 min-[1100px]:flex min-[1100px]:min-h-0 min-[1100px]:flex-col">
            <div className="flex-1 overflow-y-auto p-7 pb-20">
              <LiveSummary step={step} input={input} />
            </div>
          </aside>
        ) : null}
      </div>

      <LiveSummaryDrawer step={step} input={input} />

      <WizardNavBar
        canBack={step > 1}
        canNext={
          step === 8 ? canSubmit && !pending : step < 8 && validateWizardStep(step, input)
        }
        nextPending={step === 8 && pending}
        onBack={() => onStepChange(step - 1)}
        onNext={step === 8 ? submit : () => onStepChange(step + 1)}
        nextLabel={
          step === 8
            ? pending
              ? "Wird gespeichert …"
              : "Ergebnis anzeigen"
            : step === 7
              ? "Zur Übersicht"
              : "Weiter"
        }
      />
    </div>
  );
}
