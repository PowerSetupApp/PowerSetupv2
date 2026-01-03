"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationAdjustmentInputProps {
    id: string;
    value: number | null;
    recommendedValue: number;
    onChange: (value: number | null) => void;
    placeholder?: string;
    className?: string;
    unit?: string;
}

export function RecommendationAdjustmentInput({
    id,
    value,
    recommendedValue,
    onChange,
    placeholder,
    className,
    unit
}: RecommendationAdjustmentInputProps) {
    // Calculate 5% step, minimum 1
    const step = useMemo(() => {
        return Math.max(1, Math.round(recommendedValue * 0.05));
    }, [recommendedValue]);

    const handleDecrease = () => {
        const base = value ?? recommendedValue;
        const newValue = Math.max(0, base - step);
        onChange(newValue);
    };

    const handleIncrease = () => {
        const base = value ?? recommendedValue;
        const newValue = base + step;
        onChange(newValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "") {
            onChange(null);
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    return (
        <div className={cn("relative flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={handleDecrease}
                className="h-10 w-10 shrink-0"
                title={`-5% (-${step} ${unit || ''})`}
                type="button"
            >
                <Minus className="h-4 w-4" />
            </Button>

            <div className="relative flex-1">
                <Input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={placeholder || recommendedValue.toString()}
                    value={value ?? ""}
                    onChange={handleChange}
                    className={cn(
                        "pr-8 text-center", // Center text for better numeric input feel
                        value ? "border-amber-500 ring-amber-500/20 font-medium" : ""
                    )}
                />
                {value && (
                    <div className="absolute right-3 top-2.5 text-xs text-amber-500 font-medium flex items-center gap-1 pointer-events-none">
                        <Settings2 className="h-3 w-3" />
                    </div>
                )}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={handleIncrease}
                className="h-10 w-10 shrink-0"
                title={`+5% (+${step} ${unit || ''})`}
                type="button"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
