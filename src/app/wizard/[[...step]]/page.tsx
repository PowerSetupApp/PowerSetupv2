"use client";

import { redirect } from "next/navigation";
import { Step1Vehicle } from "@/components/wizard/steps/step-1-vehicle";
import { Step2Voltage } from "@/components/wizard/steps/step-2-voltage";
import { Step3Energy } from "@/components/wizard/steps/step-3-energy";
import { Step4Consumers } from "@/components/wizard/steps/step-4-consumers";
import { Step5Travel } from "@/components/wizard/steps/step-5-travel";
import { Step5Autarky } from "@/components/wizard/steps/step-5-autarky";
import { Step6Solar } from "@/components/wizard/steps/step-6-solar";
import { Step7Cabling } from "@/components/wizard/steps/step-7-cabling";
import { Step8Comfort } from "@/components/wizard/steps/step-8-comfort";
import { Step9Schematic } from "@/components/wizard/steps/step-9-schematic";
import { Step10Recommendation } from "@/components/wizard/steps/step-10-recommendation";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useWizardStore } from "@/lib/store/wizard-store";
import { useEffect, use, useState, Suspense } from "react";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
// import { AlgorithmResultModal } from "@/components/wizard/algorithm-result-modal";

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
        roofAreas // Added missing destructuring
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

    // Validation: Step must be a number between 1 and 10 (now 10 steps total)
    if (isNaN(stepIndex) || stepIndex < 1 || stepIndex > 10) {
        redirect("/wizard/1");
    }
    // Sync URL with store on mount/change
    useEffect(() => {
        if (!isNaN(stepIndex) && stepIndex !== currentStep) {
            setStep(stepIndex);
        }
    }, [stepIndex, setStep, currentStep]);

    // Define Steps (10 total now)
    const steps = [
        { id: 1, label: "Fahrzeug" },
        { id: 2, label: "Spannung" },
        { id: 3, label: "Quellen" },
        { id: 4, label: "Verbraucher" },
        { id: 5, label: "Reise" },
        { id: 6, label: "Autarkie" },
        { id: 7, label: "Solar" },
        { id: 8, label: "Kabel" },
        { id: 9, label: "Budget" },
        { id: 10, label: "Empfehlung" }
    ];

    const completedSteps = steps.filter(s => s.id < stepIndex).map(s => s.id);

    const handleStepClick = (stepId: number) => {
        if (stepId < stepIndex) {
            router.push(`/wizard/${stepId}`);
        }
    };

    const handleNext = () => {
        let nextStep = stepIndex + 1;

        // Skip Step 7 (Solar) if not selected
        // Re-checking this logic to ensure we don't accidentally skip multiple steps or land on wrong one
        // If we are at Step 6 and click Next:
        if (stepIndex === 6) {
            if (!energySources.includes('solar')) {
                nextStep = 8; // Skip Solar
            }
        }

        if (nextStep <= 10) {
            router.push(`/wizard/${nextStep}`);
        }
    };

    const handleFinish = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        // We do NOT run the algorithm test modal anymore for the final step, because Step 10 IS the visual recommendation.
        // We now proceed directly to save.

        try {
            // Collect all form data (including new overrides)
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
                // Defaults for fields not yet in wizard store
                alternatorSize: 'unknown',
                simultaneousLoad: 'moderate',
                batterySpaceSize: 'medium',
                roofAreas: (roofAreas && roofAreas.length > 0) ? roofAreas : (solarDimensions ? [{ id: 'main', name: 'Hauptfläche', length: solarDimensions.length, width: solarDimensions.width }] : []),

                // NEW: Custom Overrides
                customBatteryCapacity: useWizardStore.getState().customBatteryCapacity,
                customSolarPower: useWizardStore.getState().customSolarPower,
                customBoosterCurrent: useWizardStore.getState().customBoosterCurrent,
                customSolarControllerCurrent: useWizardStore.getState().customSolarControllerCurrent,
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
            if (error instanceof Error) {
                alert(`Fehler: ${error.message}\n\nBitte überprüfe deine Eingaben.`);
            }
        }
    };

    const handleBack = () => {
        let prevStep = stepIndex - 1;

        // Skip Step 7 (Solar) going back if not selected
        if (prevStep === 7 && !energySources.includes('solar')) {
            prevStep = 6;
        }

        if (prevStep >= 1) {
            router.push(`/wizard/${prevStep}`);
        }
    };

    const isLastStep = stepIndex === 10;

    return (
        <div className="container max-w-2xl mx-auto py-8 space-y-8 min-h-screen flex flex-col">
            <ProgressSteps
                steps={steps}
                currentStep={stepIndex}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[400px] mb-24">
                {stepIndex === 1 && <Step1Vehicle />}
                {stepIndex === 2 && <Step2Voltage />}
                {stepIndex === 3 && <Step3Energy />}
                {stepIndex === 4 && <Step4Consumers />}
                {stepIndex === 5 && <Step5Travel />}
                {stepIndex === 6 && <Step5Autarky />}
                {stepIndex === 7 && <Step6Solar />}
                {stepIndex === 8 && <Step7Cabling />}
                {stepIndex === 9 && <Step8Comfort />}
                {stepIndex === 10 && <Step10Recommendation />}
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
