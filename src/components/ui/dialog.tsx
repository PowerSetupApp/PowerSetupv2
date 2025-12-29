"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
}

// Context for dialog state
const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
} | null>(null);

function useDialogContext() {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error("Dialog components must be used within a Dialog");
    }
    return context;
}

/**
 * Dialog/Modal Component
 * - Overlay mit Backdrop-Blur
 * - Animation (fade-in/slide-up)
 * - Keyboard Support (Escape zum Schließen)
 * - Focus Trap
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
    // Close on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                onOpenChange(false);
            }
        };

        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
}

export function DialogOverlay({ className }: { className?: string }) {
    const { onOpenChange } = useDialogContext();

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
                "animate-in fade-in duration-200",
                className
            )}
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
        />
    );
}

export function DialogContent({
    children,
    className,
    title,
    description,
}: DialogContentProps) {
    const { onOpenChange } = useDialogContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Focus trap - focus first focusable element
    React.useEffect(() => {
        const firstFocusable = contentRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
    }, []);

    return (
        <>
            <DialogOverlay />
            <div
                ref={contentRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dialog-title" : undefined}
                aria-describedby={description ? "dialog-description" : undefined}
                className={cn(
                    "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
                    "max-h-[90vh] overflow-auto",
                    "rounded-2xl bg-background p-6 shadow-xl border",
                    "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className={cn(
                        "absolute right-4 top-4 p-2 rounded-full",
                        "text-muted-foreground hover:text-foreground hover:bg-muted",
                        "transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    )}
                    aria-label="Schließen"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Optional Title & Description */}
                {title && (
                    <h2 id="dialog-title" className="text-xl font-semibold pr-10">
                        {title}
                    </h2>
                )}
                {description && (
                    <p id="dialog-description" className="text-muted-foreground mt-1 pr-10">
                        {description}
                    </p>
                )}

                {/* Content */}
                <div className={cn(title || description ? "mt-4" : "")}>
                    {children}
                </div>
            </div>
        </>
    );
}

export function DialogHeader({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-1.5 pr-10", className)}>
            {children}
        </div>
    );
}

export function DialogTitle({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <h2 id="dialog-title" className={cn("text-xl font-semibold", className)}>
            {children}
        </h2>
    );
}

export function DialogDescription({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p id="dialog-description" className={cn("text-muted-foreground", className)}>
            {children}
        </p>
    );
}

export function DialogFooter({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mt-6 flex justify-end gap-3", className)}>
            {children}
        </div>
    );
}
