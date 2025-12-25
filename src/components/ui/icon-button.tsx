"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonOption<T extends string = string> {
    value: T;
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
}

export interface IconButtonProps<T extends string = string> {
    options: IconButtonOption<T>[];
    value: T | T[];
    onChange: (value: T | T[]) => void;
    mode: "single" | "multiple";
    className?: string;
    columns?: 2 | 3 | 4 | 5;
}

/**
 * Icon-Button Komponente für Radio/Checkbox-Auswahl mit Icons
 * - 80x80px Touch-Target (mindestens 48x48px)
 * - Mobile-first Design
 * - Unterstützt Einzel- und Mehrfachauswahl
 */
export function IconButton<T extends string = string>({
    options,
    value,
    onChange,
    mode,
    className,
    columns = 3,
}: IconButtonProps<T>) {
    const handleClick = (optionValue: T) => {
        if (mode === "single") {
            onChange(optionValue);
        } else {
            const currentValues = Array.isArray(value) ? value : [];
            if (currentValues.includes(optionValue)) {
                onChange(currentValues.filter((v) => v !== optionValue));
            } else {
                onChange([...currentValues, optionValue]);
            }
        }
    };

    const isSelected = (optionValue: T) => {
        if (mode === "single") {
            return value === optionValue;
        }
        return Array.isArray(value) && value.includes(optionValue);
    };

    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
    };

    return (
        <div className={cn("grid gap-3", gridCols[columns], className)}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => handleClick(option.value)}
                    className={cn(
                        "flex flex-col items-center justify-center",
                        "min-h-[80px] min-w-[80px] p-4",
                        "rounded-xl border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        "hover:border-primary/50 hover:bg-primary/5",
                        "active:scale-95",
                        isSelected(option.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/20 bg-card text-muted-foreground"
                    )}
                >
                    <span className="text-2xl sm:text-3xl mb-2">{option.icon}</span>
                    <span className="text-sm font-medium text-center leading-tight">
                        {option.label}
                    </span>
                    {option.sublabel && (
                        <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">
                            {option.sublabel}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
