"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface WizardNavBarProps {
  canBack: boolean;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export function WizardNavBar({
  canBack,
  canNext,
  onBack,
  onNext,
  nextLabel = "Weiter",
}: WizardNavBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
      role="navigation"
      aria-label="Wizard-Navigation"
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 min-h-12 w-full min-w-0 rounded-2xl border-border/80"
          disabled={!canBack}
          onClick={onBack}
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          <span className="max-[360px]:sr-only">Zurück</span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-12 min-h-12 w-full min-w-0 rounded-2xl"
          disabled={!canNext}
          onClick={onNext}
        >
          <span className="min-w-0 max-[360px]:sr-only truncate">{nextLabel}</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
