"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    formatValue?: (value: number) => string;
    className?: string;
}

export function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    suffix,
    formatValue,
    className,
}: NumberStepperProps) {
    const decrease = () => {
        const newValue = Math.max(min, value - step);
        onChange(Math.round(newValue * 100) / 100); // Avoid floating point issues
    };

    const increase = () => {
        const newValue = Math.min(max, value + step);
        onChange(Math.round(newValue * 100) / 100);
    };

    const displayValue = React.useMemo(() => {
        const val = isNaN(value) ? min : value;
        return formatValue ? formatValue(val) : val;
    }, [value, min, formatValue]);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <button
                type="button"
                onClick={decrease}
                disabled={value <= min}
                className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-md border transition-colors",
                    "bg-muted hover:bg-muted/80 active:bg-muted/60",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "touch-manipulation" // Improves touch response
                )}
                aria-label="Decrease"
            >
                <Minus className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-center min-w-[4rem] px-2 h-10 bg-background border rounded-md font-medium text-center">
                <span>{displayValue}</span>
                {suffix && <span className="text-muted-foreground ml-1 text-sm">{suffix}</span>}
            </div>
            <button
                type="button"
                onClick={increase}
                disabled={value >= max}
                className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-md border transition-colors",
                    "bg-muted hover:bg-muted/80 active:bg-muted/60",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "touch-manipulation"
                )}
                aria-label="Increase"
            >
                <Plus className="h-5 w-5" />
            </button>
        </div>
    );
}
