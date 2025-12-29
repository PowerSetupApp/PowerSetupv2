"use client";

import * as React from "react";
import { useWizardStore, type VehicleType } from "@/lib/store/wizard-store";
import { IconButton, type IconButtonOption } from "@/components/ui/icon-button";
import { useTranslations } from "next-intl";

export function Step1Vehicle() {
    const { vehicleType, setVehicleType } = useWizardStore();
    const t = useTranslations("Wizard.Step1");

    const VEHICLE_OPTIONS: IconButtonOption<VehicleType>[] = [
        { value: "campervan", label: t("options.campervan"), icon: "🚐", sublabel: t("options.campervan_sub") },
        { value: "motorhome", label: t("options.motorhome"), icon: "🚙", sublabel: t("options.motorhome_sub") },
        { value: "caravan", label: t("options.caravan"), icon: "🏕️", sublabel: t("options.caravan_sub") },
        { value: "boat", label: t("options.boat"), icon: "⛵", sublabel: t("options.boat_sub") },
        { value: "offroad", label: t("options.offroad"), icon: "🚗", sublabel: t("options.offroad_sub") },
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
        </div>
    );
}
