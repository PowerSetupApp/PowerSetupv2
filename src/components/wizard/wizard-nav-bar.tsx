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
    <div className="mt-auto flex gap-3 border-t border-border pt-4">
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={!canBack}
        onClick={onBack}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Zurück
      </Button>
      <Button type="button" className="flex-1 sm:ml-auto sm:flex-none" disabled={!canNext} onClick={onNext}>
        {nextLabel}
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
