"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shellInner = "mx-auto w-full max-w-[min(100%,var(--wizard-max-width))]";
const navInner =
  "grid w-full grid-cols-2 gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 min-[1100px]:flex min-[1100px]:w-full min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-6 min-[1100px]:px-10";
const navButton =
  "h-12 min-h-12 w-full min-w-0 rounded-2xl min-[1100px]:w-[min(100%,14rem)] min-[1100px]:min-w-[11rem] min-[1100px]:max-w-[14rem] min-[1100px]:shrink-0";

export interface WizardNavBarProps {
  canBack: boolean;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** Schritt 8: Submit läuft — Spinner im Weiter-Button */
  nextPending?: boolean;
  className?: string;
}

export function WizardNavBar({
  canBack,
  canNext,
  onBack,
  onNext,
  nextLabel = "Weiter",
  nextPending = false,
  className,
}: WizardNavBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border-1 bg-bg-1/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg-1/80",
        className,
      )}
      role="navigation"
      aria-label="Wizard-Navigation"
    >
      <div className={cn(navInner, shellInner)}>
        {canBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(navButton, "border-border/80")}
            onClick={onBack}
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="max-[360px]:sr-only">Zurück</span>
          </Button>
        ) : (
          <span className="hidden min-[1100px]:block min-[1100px]:min-w-[11rem]" aria-hidden />
        )}
        <Button
          type="button"
          size="lg"
          className={cn(navButton, !canBack && "col-start-2 min-[1100px]:ml-auto")}
          disabled={!canNext}
          onClick={onNext}
          iconLeft={
            nextPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : undefined
          }
        >
          <span className="min-w-0 max-[360px]:sr-only max-[1099px]:truncate">{nextLabel}</span>
          {!nextPending ? <ChevronRight className="size-4 shrink-0" aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
