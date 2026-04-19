"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardOption<T extends string = string> {
    value: T;
    icon: React.ReactNode;
    title: string;
    description?: string;
    badge?: string;
    disabled?: boolean;
}

export interface CardSelectionProps<T extends string = string> {
    options: CardOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    columns?: 2 | 3;
}

/**
 * Card-Selection Komponente für große Auswahlkarten
 * - Radio-Verhalten
 * - Ideal für Komfort-Level, Schaltplan-Stil
 * - Mit optionalem Badge (€, €€, €€€)
 */
export function CardSelection<T extends string = string>({
    options,
    value,
    onChange,
    className,
    columns = 3,
}: CardSelectionProps<T>) {
    const gridCols = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    };

    return (
        <div className={cn("grid gap-4", gridCols[columns], className)}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => !option.disabled && onChange(option.value)}
                    className={cn(
                        "relative flex flex-col items-center p-6",
                        "rounded-2xl border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        "min-h-[160px]",
                        option.disabled
                            ? "opacity-50 cursor-not-allowed border-muted bg-muted/20 grayscale"
                            : "hover:border-primary/50 hover:shadow-md active:scale-[0.98]",
                        !option.disabled && value === option.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : !option.disabled
                                ? "border-muted-foreground/20 bg-card"
                                : ""
                    )}
                >
                    {/* Badge */}
                    {option.badge && (
                        <span
                            className={cn(
                                "absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium",
                                value === option.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {option.badge}
                        </span>
                    )}

                    {/* Icon */}
                    <span className="text-4xl mb-3">{option.icon}</span>

                    {/* Title */}
                    <span
                        className={cn(
                            "text-lg font-semibold mb-2",
                            value === option.value ? "text-primary" : "text-foreground"
                        )}
                    >
                        {option.title}
                    </span>

                    {/* Description */}
                    <span className="text-sm text-muted-foreground text-center leading-relaxed">
                        {option.description}
                    </span>

                    {/* Selection Indicator */}
                    <div
                        className={cn(
                            "absolute bottom-4 w-5 h-5 rounded-full border-2 transition-all",
                            value === option.value
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                        )}
                    >
                        {value === option.value && (
                            <svg
                                className="w-full h-full text-primary-foreground p-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}
