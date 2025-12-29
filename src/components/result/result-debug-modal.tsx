"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import ResultJsonViewer from "./result-json-viewer";
import { Prisma } from "@prisma/client";
import { useState } from "react";

interface ResultDebugModalProps {
    resultId: string;
    formData: Prisma.JsonValue;
    calculations: Prisma.JsonValue;
    recommendations: Prisma.JsonValue;
    schematicData: Prisma.JsonValue;
    productContext?: string;
    fullPrompt?: string;
    products?: any[]; // Allow generic array to avoid complex imports in client component
}

export default function ResultDebugModal(props: ResultDebugModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="destructive"
                size="sm"
                className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity"
                onClick={() => setIsOpen(true)}
            >
                <Bug className="h-4 w-4 mr-2" />
                Debug
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Debug View</DialogTitle>
                        <DialogDescription>
                            Raw details and AI interaction logs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <ResultJsonViewer {...props} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
