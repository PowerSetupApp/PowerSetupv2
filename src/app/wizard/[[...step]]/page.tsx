"use client";

import { redirect } from "next/navigation";
// Step 1 removed (Vehicle), Step 6 Solar removed (integrated into Sources)
import { Step1Voltage } from "@/components/wizard/steps/step-1-voltage";
import { Step2Energy } from "@/components/wizard/steps/step-2-energy";
import { Step3Consumers } from "@/components/wizard/steps/step-3-consumers";
import { Step4Travel } from "@/components/wizard/steps/step-4-travel";
import { Step5Autarky } from "@/components/wizard/steps/step-5-autarky";
import { Step6Cabling } from "@/components/wizard/steps/step-6-cabling";
import { Step7Brands } from "@/components/wizard/steps/step-7-brands";
// Step 9 Schematic was not rendered in previous version either
import { Step8Recommendation } from "@/components/wizard/steps/step-8-recommendation";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useWizardStore } from "@/lib/store/wizard-store";
import { useEffect, use, useState, Suspense } from "react";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function WizardContent({ params }: { params: Promise<{ step?: string[] }> }) {
    const t = useTranslations("Wizard");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        currentStep,
        setStep,
        energySources,
        vehicleType,
        vehicleVoltage,
        systemVoltage,
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

        reset,
        roofAreas,
        shoreChargingSpeed
    } = useWizardStore();

    // Reset Store if requested (only once per session)
    useEffect(() => {
        if (searchParams.get("reset") === "true") {
            console.log("Resetting Wizard Store...");
            reset();
            // Remove reset param to avoid re-triggering on refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
        }
    }, [searchParams, reset]);

    // Unwrap params using React.use()
    const resolvedParams = use(params);

    // Determine current step from URL
    const stepParam = resolvedParams.step?.[0];
    const stepIndex = stepParam ? parseInt(stepParam) : 1;

    // Validation: Step must be a number between 1 and 8 (now 8 steps total - Solar integrated into Sources)
    if (isNaN(stepIndex) || stepIndex < 1 || stepIndex > 8) {
        redirect("/wizard/1");
    }
    // Sync URL with store on mount/change
    useEffect(() => {
        // Ensure we update the store with the current step from URL
        if (!isNaN(stepIndex) && stepIndex !== currentStep) {
            setStep(stepIndex);
        }
    }, [stepIndex, setStep, currentStep]);

    // Define Steps (8 total - Solar integrated into Sources step)
    const steps = [
        { id: 1, label: "Spannung" },
        { id: 2, label: "Quellen" },
        { id: 3, label: "Verbraucher" },
        { id: 4, label: "Reise" },
        { id: 5, label: "Autarkie" },
        { id: 6, label: "Kabel" },
        { id: 7, label: "Marken" },
        { id: 8, label: "Empfehlung" }
    ];

    const completedSteps = steps.filter(s => s.id < stepIndex).map(s => s.id);

    const handleStepClick = (stepId: number) => {
        if (stepId < stepIndex) {
            router.push(`/wizard/${stepId}`);
        }
    };

    const handleNext = () => {
        const nextStep = stepIndex + 1;
        if (nextStep <= 8) {
            router.push(`/wizard/${nextStep}`);
        }
    };

    const handleFinish = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Collect all form data
            const formData = {
                vehicleType,
                vehicleVoltage,
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
                shoreChargingSpeed,
                // Defaults for fields not yet in wizard store
                simultaneousLoad: 'moderate',
                batterySpaceSize: 'medium',
                roofAreas: (roofAreas && roofAreas.length > 0) ? roofAreas : (solarDimensions ? [{ id: 'main', name: 'Hauptfläche', length: solarDimensions.length, width: solarDimensions.width }] : []),

                // Custom Overrides
                customBatteryCapacity: useWizardStore.getState().customBatteryCapacity,
                customSolarPower: useWizardStore.getState().customSolarPower,
                customBoosterCurrent: useWizardStore.getState().customBoosterCurrent,
                customSolarControllerCurrent: useWizardStore.getState().customSolarControllerCurrent,
            };

            console.log("Submitting Wizard FormData:", formData);
            console.log("Energy Sources:", energySources);

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
            setIsSubmitting(false);
            if (error instanceof Error) {
                alert(`Fehler: ${error.message}\n\nBitte überprüfe deine Eingaben.`);
            }
        }
    };

    const handleBack = () => {
        const prevStep = stepIndex - 1;
        if (prevStep >= 1) {
            router.push(`/wizard/${prevStep}`);
        }
    };

    const isLastStep = stepIndex === 8;

    return (
        <div className="container max-w-2xl mx-auto py-8 space-y-8 min-h-screen flex flex-col">
            <ProgressSteps
                steps={steps}
                currentStep={stepIndex}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[400px] mb-24">
                {stepIndex === 1 && <Step1Voltage />}
                {stepIndex === 2 && <Step2Energy />}
                {stepIndex === 3 && <Step3Consumers />}
                {stepIndex === 4 && <Step4Travel />}
                {stepIndex === 5 && <Step5Autarky />}
                {stepIndex === 6 && <Step6Cabling />}
                {stepIndex === 7 && <Step7Brands />}
                {stepIndex === 8 && <Step8Recommendation />}
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50">
                <div className="container max-w-2xl mx-auto flex gap-4">
                    {stepIndex > 1 && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {t("Navigation.back")}
                        </Button>
                    )}
                    <Button
                        onClick={isLastStep ? handleFinish : handleNext}
                        disabled={isSubmitting}
                        className={cn("flex-1", stepIndex === 1 && "w-full")}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("Navigation.loading")}
                            </>
                        ) : isLastStep ? (
                            t("Navigation.finish")
                        ) : (
                            t("Navigation.next")
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function WizardPage({ params }: { params: Promise<{ step?: string[] }> }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <WizardContent params={params} />
        </Suspense>
    );
}
