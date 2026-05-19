"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WizardStepTransition({ step, children }: { step: number; children: ReactNode }) {
  const prevRef = useRef<number | null>(null);
  const isFirst = prevRef.current === null;
  const forward = prevRef.current !== null && step > prevRef.current;

  useLayoutEffect(() => {
    prevRef.current = step;
  }, [step]);

  const animClass = isFirst ? "" : forward ? "wizard-step-enter-forward" : "wizard-step-enter-back";

  return (
    <div key={step} className={cn("flex min-h-0 flex-1 flex-col", animClass)}>
      {children}
    </div>
  );
}
