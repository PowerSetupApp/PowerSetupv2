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

/**
 * Progress-Steps Komponente (8 Schritte)
 * - Visueller Fortschrittsanzeiger
 * - Klickbar für Navigation zu abgeschlossenen Schritten
 * - Mobile-responsive (kurze Labels auf kleinen Screens)
 */
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
            {/* Desktop View */}
            <div className="hidden sm:flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        {/* Step Indicator */}
                        <button
                            type="button"
                            onClick={() => isClickable(step.id) && onStepClick?.(step.id)}
                            disabled={!isClickable(step.id)}
                            className={cn(
                                "flex flex-col items-center gap-2 transition-all",
                                isClickable(step.id) ? "cursor-pointer" : "cursor-not-allowed"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    "border-2 transition-all duration-300",
                                    "text-sm font-medium",
                                    isCompleted(step.id)
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent(step.id)
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted border-muted-foreground/20 text-muted-foreground"
                                )}
                            >
                                {isCompleted(step.id) ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
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
                                    "text-xs text-center max-w-[80px] leading-tight",
                                    isCurrent(step.id) || isCompleted(step.id)
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </button>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                                    isCompleted(step.id)
                                        ? "bg-primary"
                                        : "bg-muted-foreground/20"
                                )}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Mobile View - Compact */}
            <div className="sm:hidden">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-primary">
                        Schritt {currentStep} von {steps.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        – {steps.find((s) => s.id === currentStep)?.label}
                    </span>
                </div>
                <div className="flex gap-1">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-all duration-300",
                                isCompleted(step.id)
                                    ? "bg-primary"
                                    : isCurrent(step.id)
                                        ? "bg-primary/50"
                                        : "bg-muted-foreground/20"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
