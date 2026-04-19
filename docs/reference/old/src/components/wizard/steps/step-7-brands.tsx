"use client";

import { useTranslations } from "next-intl";
import { useWizardStore } from "@/lib/store/wizard-store";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveBrandsWithProducts, Brand } from "@/app/actions/brands";
import { useEffect, useState } from "react";

export function Step7Brands() {
    const t = useTranslations("Wizard.Step9");
    const {
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Marken-Präferenzen</h2>
                <p className="text-muted-foreground">
                    Hast du bevorzugte Hersteller? Wir versuchen diese bei der Empfehlung zu berücksichtigen. (Optional)
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
    );
}
