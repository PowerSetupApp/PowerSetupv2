"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProgressSteps, type Step } from "@/components/ui/progress-steps";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";

const STEPS: Step[] = [
    { id: 1, label: "Fahrzeug", shortLabel: "Fahrzeug" },
    { id: 2, label: "Spannung", shortLabel: "Spannung" },
    { id: 3, label: "Energie", shortLabel: "Energie" },
    { id: 4, label: "Verbraucher", shortLabel: "Verbraucher" },
    { id: 5, label: "Nutzung", shortLabel: "Nutzung" },
    { id: 6, label: "Autarkie", shortLabel: "Autarkie" },
    { id: 7, label: "Komfort", shortLabel: "Komfort" },
    { id: 8, label: "Schaltplan", shortLabel: "Plan" },
];

interface WizardWrapperProps {
    children: React.ReactNode;
    step: number;
}

export function WizardWrapper({ children, step }: WizardWrapperProps) {
    const router = useRouter();
    const { currentStep, setStep } = useWizardStore();

    // Sync URL step with store
    React.useEffect(() => {
        if (step !== currentStep) {
            setStep(step);
        }
    }, [step, setStep, currentStep]);

    const handleNext = () => {
        const next = Math.min(step + 1, STEPS.length);
        router.push(`/wizard/${next}`);
    };

    const handleBack = () => {
        const prev = Math.max(step - 1, 1);
        router.push(`/wizard/${prev}`);
    };

    const handleStepClick = (stepId: number) => {
        router.push(`/wizard/${stepId}`);
    };

    // Calculate completed steps (simple logic for now: all previous steps)
    const completedSteps = STEPS.map(s => s.id).filter(id => id < step);

    const isFirstStep = step === 1;
    const isLastStep = step === STEPS.length;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header / Progress */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="container max-w-lg mx-auto px-4 py-4">
                    <ProgressSteps
                        steps={STEPS}
                        currentStep={step}
                        completedSteps={completedSteps}
                        onStepClick={handleStepClick}
                    />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 container max-w-lg mx-auto px-4 py-8 relative">
                <div className="pb-24"> {/* Space for fixed footer */}
                    {children}
                </div>
            </main>

            {/* Footer / Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
                <div className="container max-w-lg mx-auto flex gap-4">
                    {!isFirstStep && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex-1"
                        >
                            Zurück
                        </Button>
                    )}
                    <Button
                        onClick={handleNext}
                        className={cn("flex-1", isFirstStep && "w-full")}
                    >
                        {isLastStep ? "Fertigstellen" : "Weiter"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
