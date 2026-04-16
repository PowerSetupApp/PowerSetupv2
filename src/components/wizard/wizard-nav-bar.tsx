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
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 min-h-12 w-full rounded-2xl border-border/80 sm:w-auto sm:min-w-[9rem]"
        disabled={!canBack}
        onClick={onBack}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Zurück
      </Button>
      <Button
        type="button"
        size="lg"
        className="h-12 min-h-12 w-full rounded-2xl sm:ml-auto sm:w-auto sm:min-w-[9rem]"
        disabled={!canNext}
        onClick={onNext}
      >
        {nextLabel}
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
