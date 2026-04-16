"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  label: string;
  shortLabel?: string;
}

export interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepId: number) => void;
  className?: string;
}

/** Eight-step style progress (visual + compact mobile). */
export function ProgressSteps({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ProgressStepsProps) {
  const isCompleted = (stepId: number) => completedSteps.includes(stepId);
  const isCurrent = (stepId: number) => stepId === currentStep;
  const isClickable = (stepId: number) => isCompleted(stepId) || isCurrent(stepId);

  return (
    <div className={cn("w-full", className)}>
      <div className="hidden items-center justify-between sm:flex">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => isClickable(step.id) && onStepClick?.(step.id)}
              disabled={!isClickable(step.id)}
              aria-current={isCurrent(step.id) ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                isClickable(step.id) ? "cursor-pointer" : "cursor-not-allowed",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-medium transition-[border-color,background-color,color] duration-200 ease-out motion-reduce:transition-none",
                  isCompleted(step.id)
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : isCurrent(step.id)
                      ? "border-primary bg-primary/12 text-primary shadow-sm"
                      : "border-muted-foreground/25 bg-muted text-muted-foreground",
                )}
              >
                {isCompleted(step.id) ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "max-w-[80px] text-center text-xs leading-tight",
                  isCurrent(step.id) || isCompleted(step.id)
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors duration-200 ease-out motion-reduce:transition-none",
                  isCompleted(step.id) ? "bg-primary" : "bg-muted-foreground/20",
                )}
              />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <div className="sm:hidden">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            Schritt {currentStep} von {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            – {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="flex gap-1.5" role="list" aria-label="Schritte">
          {steps.map((step) => (
            <div
              key={step.id}
              role="listitem"
              className={cn(
                "h-2 min-h-2 flex-1 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none",
                isCompleted(step.id)
                  ? "bg-primary"
                  : isCurrent(step.id)
                    ? "bg-primary/55"
                    : "bg-muted-foreground/25",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
