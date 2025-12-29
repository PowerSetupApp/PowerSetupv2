"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProgressSteps, type Step } from "@/components/ui/progress-steps";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/store/wizard-store";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const STEPS: Step[] = [
    { id: 1, label: "Fahrzeug", shortLabel: "Fahrzeug" },
    { id: 2, label: "Spannung", shortLabel: "Spannung" },
    { id: 3, label: "Energie", shortLabel: "Energie" },
    { id: 4, label: "Verbraucher", shortLabel: "Verbraucher" },
    { id: 5, label: "Reiseverhalten", shortLabel: "Reise" },
    { id: 6, label: "Autarkie", shortLabel: "Autarkie" },
    { id: 7, label: "Komfort", shortLabel: "Komfort" },
    { id: 8, label: "Solar", shortLabel: "Solar" },
    { id: 9, label: "Schaltplan", shortLabel: "Plan" },
];

interface WizardWrapperProps {
    children: React.ReactNode;
    step: number;
}

export function WizardWrapper({ children, step }: WizardWrapperProps) {
    const router = useRouter();
    const { currentStep, setStep } = useWizardStore();
    const t = useTranslations("Wizard.Navigation");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Sync URL step with store
    React.useEffect(() => {
        if (step !== currentStep) {
            setStep(step);
        }
    }, [step, setStep, currentStep]);

    const {
        vehicleType,
        systemVoltage,
        energySources,
        consumers,
        autarchyGoal,
        autarchyDays,
        solarSetupType,
        solarDimensions,
        roofModuleType,
        solarModulePreference,
        solarBags,
        cableLengths,
        comfortLevel,
        schematicPreference,
        batteryPreference,
        travelBehavior,
    } = useWizardStore();

    // Simple validation logic
    const isStepValid = React.useMemo(() => {
        switch (step) {
            case 1: // Vehicle
                return !!vehicleType;
            case 2: // Voltage
                return true; // Default is 12V
            case 3: // Energy
                return energySources.length > 0;
            case 4: // Consumers
                return consumers.length > 0;
            default:
                return true;
        }
    }, [step, vehicleType, energySources, consumers]);

    const handleNext = () => {
        if (!isStepValid) return;
        const next = Math.min(step + 1, STEPS.length);
        router.push(`/wizard/${next}`);
    };

    const handleBack = () => {
        const prev = Math.max(step - 1, 1);
        router.push(`/wizard/${prev}`);
    };

    const handleFinish = async () => {
        if (!isStepValid || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Collect all form data
            const formData = {
                vehicleType,
                systemVoltage,
                energySources,
                consumers,
                autarchyGoal,
                autarchyDays,
                solarSetupType,
                solarDimensions,
                roofModuleType,
                solarModulePreference,
                solarBags,
                cableLengths,
                comfortLevel,
                schematicPreference,
                batteryPreference,
                travelBehavior,
            };

            // POST to API
            const response = await fetch("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ formData }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Fehler beim Speichern");
            }

            const result = await response.json();

            // Redirect to result page
            router.push(`/result/${result.id}`);
        } catch (error) {
            console.error("Error submitting wizard:", error);
            // TODO: Show error toast
            setIsSubmitting(false);
        }
    };

    const handleStepClick = (stepId: number) => {
        if (stepId < step || isStepValid) {
            router.push(`/wizard/${stepId}`);
        }
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
                            disabled={isSubmitting}
                        >
                            {t("back")}
                        </Button>
                    )}
                    <Button
                        onClick={isLastStep ? handleFinish : handleNext}
                        disabled={!isStepValid || isSubmitting}
                        className={cn("flex-1", isFirstStep && "w-full")}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("loading")}
                            </>
                        ) : isLastStep ? (
                            t("finish")
                        ) : (
                            t("next")
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
