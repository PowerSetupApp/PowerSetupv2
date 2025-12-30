"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, AutarchyLevel, type BatterySpaceSize } from "@/lib/store/wizard-store";
import { CardSelection } from "@/components/ui/card-selection";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CalendarDays, Map, BatteryCharging, Box, Package, Warehouse } from "lucide-react";

export function Step5Autarky() {
    const t = useTranslations("Wizard.Step6");
    const { autarchyGoal, autarchyDays, setAutarchyGoal, batterySpaceSize, setBatterySpaceSize } = useWizardStore();

    const presets: { value: AutarchyLevel; label: string; icon: React.ReactNode; days: number }[] = [
        {
            value: "weekend",
            label: t("weekend"),
            icon: <CalendarDays className="h-6 w-6" />,
            days: 2
        },
        {
            value: "holiday",
            label: t("trip"),
            icon: <Map className="h-6 w-6" />,
            days: 7
        },
        {
            value: "full",
            label: t("full"),
            icon: <BatteryCharging className="h-6 w-6" />,
            days: 14
        },
    ];

    const handlePresetChange = (value: string) => {
        const goal = value as AutarchyLevel;
        const preset = presets.find(p => p.value === goal);
        if (preset) {
            setAutarchyGoal(goal, preset.days);
        }
    };

    const handleSliderChange = (value: number[]) => {
        const days = value[0];
        // Determine goal based on days for consistency, or keep 'custom'?
        // For now, we adjust the goal if it matches a preset, otherwise keep current or set to nearest?
        // Simple logic: just update days, goal serves as a "class" but days is the calculator value.
        // Actually, let's keep the goal as is unless they pick a specific number that matches another bucket perfectly?
        // Let's just update the days. The goal can remain what it was or switch to closest.

        // Simple approach: Update days. If days match a preset exactly, switch goal too.
        let newGoal = autarchyGoal;
        if (days <= 3) newGoal = 'weekend';
        else if (days <= 10) newGoal = 'holiday';
        else newGoal = 'full';

        setAutarchyGoal(newGoal, days);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="space-y-6">
                {/* Presets */}
                <CardSelection
                    options={presets.map(p => ({
                        value: p.value,
                        title: p.label,
                        description: p.days + " Tage", // Simple description or empty
                        icon: p.icon
                    }))}
                    value={autarchyGoal}
                    onChange={handlePresetChange}
                    columns={3}
                />

                <div className="py-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                            {t("days_label", { days: autarchyDays })}
                        </Label>
                        <span className="text-xs text-muted-foreground">1 - 30 Tage</span>
                    </div>

                    <Slider
                        value={[autarchyDays]}
                        onValueChange={handleSliderChange}
                        min={1}
                        max={30}
                        step={1}
                        className="w-full"
                    />

                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <strong>Hinweis:</strong> Je mehr Tage du autark stehen möchtest, desto größer müssen Batterie und Solaranlage dimensioniert werden.
                    </p>
                </div>

                {/* Battery Space Question */}
                <div className="pt-6 border-t border-border/50 space-y-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">{t("battery_space_title")}</h3>
                    </div>

                    <CardSelection
                        options={[
                            { value: "compact", title: t("battery_space_options.compact"), description: t("battery_space_options.compact_desc"), icon: <Box className="h-5 w-5" /> },
                            { value: "medium", title: t("battery_space_options.medium"), description: t("battery_space_options.medium_desc"), icon: <Package className="h-5 w-5" /> },
                            { value: "spacious", title: t("battery_space_options.spacious"), description: t("battery_space_options.spacious_desc"), icon: <Warehouse className="h-5 w-5" /> },
                        ]}
                        value={batterySpaceSize}
                        onChange={(val) => setBatterySpaceSize(val as BatterySpaceSize)}
                        columns={3}
                    />
                </div>
            </div>
        </div>
    );
}
