"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoModalProps {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function InfoModal({ title, description, children }: InfoModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full p-0 hover:bg-transparent"
                onClick={() => setIsOpen(true)}
            >
                <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
                <span className="sr-only">Info</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent title={title} description={description}>
                    {children}
                </DialogContent>
            </Dialog>
        </>
    );
}
