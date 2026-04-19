"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GenerateButtonProps {
    resultId: string;
}

export function GenerateButton({ resultId }: GenerateButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/result/${resultId}/schematic/generate`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Generation failed");
            }

            const data = await response.json();

            // Redirect to schematic view page
            // We'll create /schematic/[id] or /result/[id]/schematic/view
            // For now, let's assume we redirect to a new view page.
            toast.success("Schaltplan erfolgreich erstellt!");

            // Redirect to the distinct schematic page as requested by user
            // We use the resultID as the ID for now, or the schematic ID if we had one.
            router.push(`/schematic/${resultId}`);

        } catch (error) {
            console.error("Error generating schematic:", error);
            toast.error("Fehler bei der Generierung. Bitte versuche es erneut.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
            onClick={handleGenerate}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Generiere Schaltplan...
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Jetzt kostenpflichtig generieren
                </>
            )}
        </Button>
    );
}
