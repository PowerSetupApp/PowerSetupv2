"use client";

import * as React from "react";
import { useWizardStore, type VehicleType, type Voltage } from "@/lib/store/wizard-store";
import { IconButton, type IconButtonOption } from "@/components/ui/icon-button";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { useTranslations } from "next-intl";

export function Step1Vehicle() {
    const { vehicleType, setVehicleType, vehicleVoltage, setVehicleVoltage } = useWizardStore();
    const t = useTranslations("Wizard.Step1");

    const VEHICLE_OPTIONS: IconButtonOption<VehicleType>[] = [
        { value: "campervan", label: t("options.campervan"), icon: "🚐", sublabel: t("options.campervan_sub") },
        { value: "motorhome", label: t("options.motorhome"), icon: "🚙", sublabel: t("options.motorhome_sub") },
        { value: "caravan", label: t("options.caravan"), icon: "🏕️", sublabel: t("options.caravan_sub") },
        { value: "boat", label: t("options.boat"), icon: "⛵", sublabel: t("options.boat_sub") },
        { value: "offroad", label: t("options.offroad"), icon: "🚗", sublabel: t("options.offroad_sub") },
    ];

    const VOLTAGE_OPTIONS: SegmentedControlOption<Voltage>[] = [
        { value: "12V", label: "12V (Standard)" },
        { value: "24V", label: "24V" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">
                    {t("subtitle")}
                </p>
            </div>

            <IconButton<VehicleType>
                options={VEHICLE_OPTIONS}
                value={vehicleType as VehicleType}
                onChange={(val) => setVehicleType(val as VehicleType)}
                mode="single"
                columns={3}
                className="grid-cols-2 sm:grid-cols-3"
            />

            {/* Vehicle Voltage Section */}
            <div className="space-y-4 pt-8 border-t border-border/50">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">Fahrzeugspannung</h2>
                    <p className="text-muted-foreground text-sm">
                        Wie viel Volt hat die Starterbatterie / Lichtmaschine?
                    </p>
                </div>

                <div className="flex justify-center">
                    <SegmentedControl<Voltage>
                        options={VOLTAGE_OPTIONS}
                        value={vehicleVoltage}
                        onChange={(val) => setVehicleVoltage(val as Voltage)}
                        size="md"
                    />
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 justify-center">
                    <span className="text-lg">💡</span>
                    <p>
                        PKW, Campervans und Wohnmobile haben meistens <strong>12V</strong>.<br />
                        Große LKWs und Expeditionsmobile oft <strong>24V</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
}
