"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string | number = string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string | number = string> {
    options: SegmentedControlOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    size?: "sm" | "md" | "lg";
}

/**
 * Segmented Control Komponente (z.B. 12V / 24V Toggle)
 * - Pill-Style Radio-Buttons
 * - Touch-optimiert
 * - Mobile-first
 */
export function SegmentedControl<T extends string | number = string>({
    options,
    value,
    onChange,
    className,
    size = "md",
}: SegmentedControlProps<T>) {
    const sizeClasses = {
        sm: "h-9 text-sm",
        md: "h-11 text-base",
        lg: "h-14 text-lg",
    };

    return (
        <div
            className={cn(
                "inline-flex rounded-xl bg-muted p-1",
                className
            )}
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "flex items-center justify-center gap-2 px-6 rounded-lg cursor-pointer",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        "min-w-[80px]",
                        sizeClasses[size],
                        value === option.value
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
}
