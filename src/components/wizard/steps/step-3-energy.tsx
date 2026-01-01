"use client";

import * as React from "react";
import { useWizardStore, type EnergySource, type AlternatorSize, type ShoreChargingSpeed } from "@/lib/store/wizard-store";
import { IconButton, type IconButtonOption } from "@/components/ui/icon-button";
import { CardSelection } from "@/components/ui/card-selection";
import { useTranslations } from "next-intl";
import { Zap, Battery, Gauge, HelpCircle, Clock, Timer, Bolt } from "lucide-react";

import { getAlgorithmSettings, type AlgorithmSettingsData } from "@/app/actions/algorithm-settings";

export function Step3Energy() {
    const {
        energySources,
        setEnergySources,
        alternatorSize,
        setAlternatorSize,
        shoreChargingSpeed,
        setShoreChargingSpeed
    } = useWizardStore();
    const t = useTranslations("Wizard.Step3");

    // State for dynamic settings
    const [settings, setSettings] = React.useState<AlgorithmSettingsData | null>(null);

    React.useEffect(() => {
        getAlgorithmSettings().then(setSettings);
    }, []);

    const ENERGY_OPTIONS: IconButtonOption<EnergySource>[] = [
        { value: "solar", label: t("options.solar"), icon: "☀️", sublabel: t("options.solar_sub") },
        { value: "alternator", label: t("options.alternator"), icon: "⚡", sublabel: t("options.alternator_sub") },
        { value: "shore_power", label: t("options.shore_power"), icon: "🔌", sublabel: t("options.shore_power_sub") },
    ];

    const ALTERNATOR_OPTIONS = [
        { value: "standard", title: t("alternator_options.standard"), icon: <Battery className="h-5 w-5" /> },
        { value: "enhanced", title: t("alternator_options.enhanced"), icon: <Zap className="h-5 w-5" /> },
        { value: "euro6d_smart", title: t("alternator_options.euro6d_smart"), icon: <Gauge className="h-5 w-5" /> },
        { value: "unknown", title: t("alternator_options.unknown"), icon: <HelpCircle className="h-5 w-5" /> },
    ];

    // Default values if settings not loaded yet
    const slowHours = settings?.chargerTimeHoursSlow ?? 8.0;
    const normalHours = settings?.chargerTimeHoursNormal ?? 5.0;
    const fastHours = settings?.chargerTimeHoursFast ?? 3.0;

    const SHORE_CHARGING_OPTIONS = [
        {
            value: "slow",
            title: t("shore_charging_options.slow"),
            description: t("shore_charging_options.slow_desc", { hours: slowHours }),
            icon: <Clock className="h-5 w-5" />
        },
        {
            value: "normal",
            title: t("shore_charging_options.normal"),
            description: t("shore_charging_options.normal_desc", { hours: normalHours }),
            icon: <Timer className="h-5 w-5" />
        },
        {
            value: "fast",
            title: t("shore_charging_options.fast"),
            description: t("shore_charging_options.fast_desc", { hours: fastHours }),
            icon: <Bolt className="h-5 w-5" />
        },
    ];

    const showAlternatorQuestion = energySources.includes("alternator");
    const showShoreChargingQuestion = energySources.includes("shore_power");

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

            {/* Conditional: Shore Power Charging Speed Question */}
            {showShoreChargingQuestion && (
                <div className="space-y-4 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">{t("shore_charging_title")}</h3>
                        <p className="text-sm text-muted-foreground">{t("shore_charging_hint")}</p>
                    </div>

                    <CardSelection
                        options={SHORE_CHARGING_OPTIONS}
                        value={shoreChargingSpeed}
                        onChange={(val) => setShoreChargingSpeed(val as ShoreChargingSpeed)}
                        columns={3}
                    />
                </div>
            )}
        </div>
    );
}

