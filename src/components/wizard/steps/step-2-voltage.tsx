"use client";

import * as React from "react";
import { useWizardStore, type Voltage, type BatteryType } from "@/lib/store/wizard-store";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { useTranslations } from "next-intl";

export function Step2Voltage() {
    const { systemVoltage, setSystemVoltage, batteryPreference, setBatteryPreference } = useWizardStore();
    const t = useTranslations("Wizard.Step2");

    const VOLTAGE_OPTIONS: SegmentedControlOption<Voltage>[] = [
        { value: 12, label: t("options.12V") },
        { value: 24, label: t("options.24V") },
        { value: 48, label: t("options.48V") },
    ];

    const BATTERY_OPTIONS: SegmentedControlOption<BatteryType>[] = [
        { value: "lifepo4", label: t("battery_options.lifepo4") },
        { value: "agm", label: t("battery_options.agm") },
        { value: "gel", label: t("battery_options.gel") },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Voltage Section */}
            <div className="space-y-4">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="flex justify-center">
                    <SegmentedControl<Voltage>
                        options={VOLTAGE_OPTIONS}
                        value={systemVoltage}
                        onChange={(val) => setSystemVoltage(val as Voltage)}
                        size="lg"
                    />
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                    <span className="text-lg">💡</span>
                    <p dangerouslySetInnerHTML={{ __html: t.raw("hint") }} />
                </div>
            </div>

            {/* Battery Type Section */}
            <div className="space-y-4 pt-8 border-t border-border/50">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">{t("battery_title")}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t("battery_type_label")}
                    </p>
                </div>

                <div className="flex justify-center">
                    <SegmentedControl<BatteryType>
                        options={BATTERY_OPTIONS}
                        value={batteryPreference}
                        onChange={(val) => setBatteryPreference(val as BatteryType)}
                        size="md"
                    />
                </div>

                {batteryPreference === 'lifepo4' && (
                    <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg flex gap-3 text-sm text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/50">
                        <span className="text-lg">✅</span>
                        <p dangerouslySetInnerHTML={{ __html: t.raw("lifepo4_recommendation") }} />
                    </div>
                )}
                {batteryPreference !== 'lifepo4' && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg flex gap-3 text-sm text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
                        <span className="text-lg">ℹ️</span>
                        <p dangerouslySetInnerHTML={{ __html: t.raw("lifepo4_recommendation") }} />
                    </div>
                )}
            </div>
        </div>
    );
}
