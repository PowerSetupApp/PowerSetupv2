"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    label: string;
    value: string;
    color: "blue" | "green" | "yellow" | "purple";
    subtitle?: string;
}

const colorMap = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    yellow: "border-l-yellow-500",
    purple: "border-l-purple-500"
};

export function SummaryCard({ label, value, color, subtitle }: SummaryCardProps) {
    return (
        <Card className={cn("p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow", colorMap[color])}>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                {label}
            </div>
            <div className="text-2xl md:text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {value}
            </div>
            {subtitle && (
                <div className="text-xs text-gray-400 mt-1">
                    {subtitle}
                </div>
            )}
        </Card>
    );
}
