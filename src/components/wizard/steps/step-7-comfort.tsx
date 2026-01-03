"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, ComfortLevel } from "@/lib/store/wizard-store";
import { CardSelection } from "@/components/ui/card-selection";
import { Coins, Star, Crown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveBrandsWithProducts, Brand } from "@/app/actions/brands";
import { useEffect, useState } from "react";
// Imports added at bottom of file by previous tool, moving them here for cleanliness if needed, but previous tool appended them.
// Actually, I can't easily move them with replace_file_content unless I replace the whole file or do it carefully.
// The previous tool put imports at the BOTTOM of the file because I appended them after the component. Use standard imports here.

export function Step7Comfort() {
    const t = useTranslations("Wizard.Step9");
    const {
        comfortLevel,
        setComfortLevel,
        brandPreferenceCharger,
        setBrandPreferenceCharger,
        brandPreferenceBattery,
        setBrandPreferenceBattery,
        brandPreferenceSolar,
        setBrandPreferenceSolar
    } = useWizardStore();

    const [chargerBrands, setChargerBrands] = useState<Brand[]>([]);
    const [batteryBrands, setBatteryBrands] = useState<Brand[]>([]);
    const [solarBrands, setSolarBrands] = useState<Brand[]>([]);

    useEffect(() => {
        getActiveBrandsWithProducts('CHARGER').then(setChargerBrands);
        getActiveBrandsWithProducts('BATTERY').then(setBatteryBrands);
        getActiveBrandsWithProducts('SOLAR').then(setSolarBrands);
    }, []);

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

            <div className="pt-8 border-t space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">Marken-Präferenzen (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                        Hast du bevorzugte Hersteller? Wir versuchen diese bei der Empfehlung zu berücksichtigen.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Ladeelektronik (Ladegeräte, Booster, etc.)</Label>
                        <Select
                            value={brandPreferenceCharger || "no_preference"}
                            onValueChange={(val) => setBrandPreferenceCharger(val === "no_preference" ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Keine Präferenz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_preference">Keine Präferenz</SelectItem>
                                {chargerBrands.map((b) => (
                                    <SelectItem key={b.id} value={b.name}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Batterien</Label>
                        <Select
                            value={brandPreferenceBattery || "no_preference"}
                            onValueChange={(val) => setBrandPreferenceBattery(val === "no_preference" ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Keine Präferenz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_preference">Keine Präferenz</SelectItem>
                                {batteryBrands.map((b) => (
                                    <SelectItem key={b.id} value={b.name}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Solarmodule</Label>
                        <Select
                            value={brandPreferenceSolar || "no_preference"}
                            onValueChange={(val) => setBrandPreferenceSolar(val === "no_preference" ? null : val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Keine Präferenz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_preference">Keine Präferenz</SelectItem>
                                {solarBrands.map((b) => (
                                    <SelectItem key={b.id} value={b.name}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}


