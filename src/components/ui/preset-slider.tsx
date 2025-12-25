"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export interface PresetOption<T extends string = string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
    numericValue: number;
}

export interface PresetSliderProps<T extends string = string> {
    presets: PresetOption<T>[];
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    showSlider?: boolean;
    className?: string;
}

/**
 * Preset-Slider Hybrid Komponente
 * - Preset-Buttons für schnelle Auswahl
 * - Optionaler Range-Slider für Feineinstellung
 * - Zero-Keyboard Design
 */
export function PresetSlider<T extends string = string>({
    presets,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = "",
    showSlider = true,
    className,
}: PresetSliderProps<T>) {
    const [isAdvanced, setIsAdvanced] = React.useState(false);

    const handlePresetClick = (preset: PresetOption<T>) => {
        onChange(preset.numericValue);
    };

    const isPresetSelected = (preset: PresetOption<T>) => {
        return value === preset.numericValue;
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <button
                        key={preset.value}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2",
                            "rounded-lg border-2 transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            "hover:border-primary/50",
                            "min-h-[44px]",
                            isPresetSelected(preset)
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-muted-foreground/20 bg-card text-muted-foreground"
                        )}
                    >
                        {preset.icon && <span className="text-lg">{preset.icon}</span>}
                        <span className="text-sm">{preset.label}</span>
                    </button>
                ))}

                {/* Erweitert Button */}
                {showSlider && (
                    <button
                        type="button"
                        onClick={() => setIsAdvanced(!isAdvanced)}
                        className={cn(
                            "px-4 py-2 rounded-lg border-2 transition-all duration-200",
                            "text-sm min-h-[44px]",
                            isAdvanced
                                ? "border-primary/50 bg-primary/5 text-primary"
                                : "border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
                        )}
                    >
                        {isAdvanced ? "Einfach" : "Erweitert"}
                    </button>
                )}
            </div>

            {/* Slider (wenn erweitert) */}
            {showSlider && isAdvanced && (
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{min}{unit}</span>
                        <span className="font-medium text-foreground">{value}{unit}</span>
                        <span>{max}{unit}</span>
                    </div>
                    <Slider
                        value={[value]}
                        onValueChange={([v]) => onChange(v)}
                        min={min}
                        max={max}
                        step={step}
                        className="py-4"
                    />
                </div>
            )}
        </div>
    );
}
