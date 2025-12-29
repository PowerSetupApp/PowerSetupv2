"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, ComfortLevel } from "@/lib/store/wizard-store";
import { CardSelection } from "@/components/ui/card-selection";
import { Coins, Star, Crown } from "lucide-react";

export function Step8Comfort() {
    const t = useTranslations("Wizard.Step9");
    const { comfortLevel, setComfortLevel } = useWizardStore();

    const options = [
        {
            value: "budget",
            title: t("budget"),
            description: t("budget_desc"),
            icon: <Coins className="h-6 w-6" />,
            badge: "€"
        },
        {
            value: "standard",
            title: t("standard"),
            description: t("standard_desc"),
            icon: <Star className="h-6 w-6" />,
            badge: "€€"
        },
        {
            value: "premium",
            title: t("premium"),
            description: t("premium_desc"),
            icon: <Crown className="h-6 w-6" />,
            badge: "€€€"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <CardSelection
                options={options}
                value={comfortLevel}
                onChange={(val) => setComfortLevel(val as ComfortLevel)}
                columns={3}
            />
        </div>
    );
}
