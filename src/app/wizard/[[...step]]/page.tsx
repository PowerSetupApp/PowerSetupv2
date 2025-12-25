import { redirect } from "next/navigation";
import { WizardWrapper } from "@/components/wizard/wizard-wrapper";

interface PageProps {
    params: Promise<{
        step?: string[];
    }>;
}

export default async function WizardPage({ params }: PageProps) {
    const resolvedParams = await params;

    // Default to step 1 if no step is provided
    if (!resolvedParams.step || resolvedParams.step.length === 0) {
        redirect("/wizard/1");
    }

    const stepNumber = parseInt(resolvedParams.step[0], 10);

    // Validation: Step must be a number between 1 and 8
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
        redirect("/wizard/1");
    }

    return (
        <WizardWrapper step={stepNumber}>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">
                    Schritt {stepNumber}
                </h1>
                <p className="text-muted-foreground">
                    Inhalt für Schritt {stepNumber} wird hier geladen.
                </p>
                <div className="p-8 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    Platzhalter für Formular-Komponenten
                </div>
            </div>
        </WizardWrapper>
    );
}
