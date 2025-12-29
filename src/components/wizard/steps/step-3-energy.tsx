"use client";

import * as React from "react";
import { useWizardStore, type EnergySource, type AlternatorSize } from "@/lib/store/wizard-store";
import { IconButton, type IconButtonOption } from "@/components/ui/icon-button";
import { CardSelection } from "@/components/ui/card-selection";
import { useTranslations } from "next-intl";
import { Zap, Battery, Gauge, HelpCircle } from "lucide-react";

export function Step3Energy() {
    const { energySources, setEnergySources, alternatorSize, setAlternatorSize } = useWizardStore();
    const t = useTranslations("Wizard.Step3");

    const ENERGY_OPTIONS: IconButtonOption<EnergySource>[] = [
        { value: "solar", label: t("options.solar"), icon: "☀️", sublabel: t("options.solar_sub") },
        { value: "alternator", label: t("options.alternator"), icon: "⚡", sublabel: t("options.alternator_sub") },
        { value: "shore_power", label: t("options.shore_power"), icon: "🔌", sublabel: t("options.shore_power_sub") },
        { value: "generator", label: t("options.generator"), icon: "⛽", sublabel: t("options.generator_sub") },
    ];

    const ALTERNATOR_OPTIONS = [
        { value: "standard", title: t("alternator_options.standard"), icon: <Battery className="h-5 w-5" /> },
        { value: "enhanced", title: t("alternator_options.enhanced"), icon: <Zap className="h-5 w-5" /> },
        { value: "euro6d_smart", title: t("alternator_options.euro6d_smart"), icon: <Gauge className="h-5 w-5" /> },
        { value: "unknown", title: t("alternator_options.unknown"), icon: <HelpCircle className="h-5 w-5" /> },
    ];

    const showAlternatorQuestion = energySources.includes("alternator");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">
                    {t("subtitle")}
                </p>
            </div>

            <IconButton<EnergySource>
                options={ENERGY_OPTIONS}
                value={energySources}
                onChange={(newValues) => {
                    setEnergySources(newValues as EnergySource[]);
                }}
                mode="multiple"
                columns={3}
                className="grid-cols-2 sm:grid-cols-3"
            />

            <div className="bg-yellow-50/50 dark:bg-yellow-950/20 p-4 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/50 text-center">
                <p dangerouslySetInnerHTML={{ __html: t.raw("hint") }} />
            </div>

            {/* Conditional: Alternator Size Question */}
            {showAlternatorQuestion && (
                <div className="space-y-4 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">{t("alternator_title")}</h3>
                        <p className="text-sm text-muted-foreground">{t("alternator_hint")}</p>
                    </div>

                    <CardSelection
                        options={ALTERNATOR_OPTIONS}
                        value={alternatorSize}
                        onChange={(val) => setAlternatorSize(val as AlternatorSize)}
                        columns={2}
                    />
                </div>
            )}
        </div>
    );
}

