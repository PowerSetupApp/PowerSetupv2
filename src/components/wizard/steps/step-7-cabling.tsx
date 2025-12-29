"use client";

import { useTranslations } from "next-intl";
import { useWizardStore } from "@/lib/store/wizard-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Cable, Zap, Sun, Droplets, Plug2 } from "lucide-react";

export function Step7Cabling() {
    const t = useTranslations("Wizard.Step8");
    const {
        cableLengths, setCableLengths, setCustomCableLength,
        energySources, consumers
    } = useWizardStore();

    const hasAlternator = energySources.includes('alternator');
    const hasSolar = energySources.includes('solar');

    // Filter out 230V devices entirely from cabling step
    const relevantConsumers = consumers.filter(c => c.voltage !== '230V');

    // Check specific specific fixed consumers (must be relevant, i.e., not 230V)
    const hasFixedBoiler = relevantConsumers.some(c => c.id === 'boiler' && c.isFixed);
    const hasFixedPump = relevantConsumers.some(c => c.id === 'pump' && c.isFixed);

    // Filter consumers for dynamic list (exclude boiler and pump as they have own sliders)
    const dynamicConsumers = relevantConsumers.filter(c =>
        c.isFixed && c.id !== 'boiler' && c.id !== 'pump'
    );

    const updateLength = (key: keyof typeof cableLengths, value: number) => {
        setCableLengths({ [key]: value });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="space-y-6">

                {/* --- STANDARD CABLES --- */}

                {/* 1. Starter -> Service (B2B) */}
                {hasAlternator && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Cable className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Label className="text-base font-semibold">{t("starter_service")}</Label>
                            </div>
                            <span className="ml-auto font-mono text-lg font-bold text-primary">
                                {cableLengths.starterToService}m
                            </span>
                        </div>
                        <Slider
                            value={[cableLengths.starterToService]}
                            min={1}
                            max={10}
                            step={0.5}
                            onValueChange={(val) => updateLength('starterToService', val[0])}
                            className="py-2"
                        />
                    </div>
                )}

                {/* 2. Service -> Inverter (Only if 230V needed) */}
                {consumers.some(c => c.voltage === '230V') && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-base font-semibold">{t("service_inverter")}</Label>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                    {t("service_inverter_note")}
                                </p>
                            </div>
                            <span className="ml-auto font-mono text-lg font-bold text-primary">
                                {cableLengths.serviceToInverter}m
                            </span>
                        </div>
                        <Slider
                            value={[cableLengths.serviceToInverter]}
                            min={0.2}
                            max={3}
                            step={0.2}
                            onValueChange={(val) => updateLength('serviceToInverter', val[0])}
                            className="py-2"
                        />
                    </div>
                )}

                {/* 3. Solar -> Regulator */}
                {hasSolar && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Sun className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <Label className="text-base font-semibold">{t("solar_regulator")}</Label>
                            </div>
                            <span className="ml-auto font-mono text-lg font-bold text-primary">
                                {cableLengths.solarToRegulator}m
                            </span>
                        </div>
                        <Slider
                            value={[cableLengths.solarToRegulator]}
                            min={1}
                            max={10}
                            step={0.5}
                            onValueChange={(val) => updateLength('solarToRegulator', val[0])}
                            className="py-2"
                        />
                    </div>
                )}

                {/* 4. Battery -> Fuse Box (Standard) */}
                <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <Label className="text-base font-semibold">{t("fusebox_label")}</Label>
                        </div>
                        <span className="ml-auto font-mono text-lg font-bold text-primary">
                            {cableLengths.batteryToFuseBox || 1}m
                        </span>
                    </div>
                    <Slider
                        value={[cableLengths.batteryToFuseBox || 1]}
                        min={0.5}
                        max={10}
                        step={0.5}
                        onValueChange={(val) => updateLength('batteryToFuseBox', val[0])}
                        className="py-2"
                    />
                </div>

                {/* --- OPTIONAL DEVICES (Only if selected & fixed & NOT 230V) --- */}

                {/* Boiler */}
                {hasFixedBoiler && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50 animate-in fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Droplets className="h-5 w-5 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                                <Label className="text-base font-semibold truncate block">
                                    {t("custom_prefix")} {t("boiler_label")}
                                </Label>
                            </div>
                            <span className="ml-auto font-mono text-lg font-bold text-primary">
                                {cableLengths.boiler || 3}m
                            </span>
                        </div>
                        <Slider
                            value={[cableLengths.boiler || 3]}
                            min={1}
                            max={15}
                            step={0.5}
                            onValueChange={(val) => updateLength('boiler', val[0])}
                            className="py-2"
                        />
                    </div>
                )}

                {/* Water Pump */}
                {hasFixedPump && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50 animate-in fade-in slide-in-from-left-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Droplets className="h-5 w-5 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                                <Label className="text-base font-semibold truncate block">
                                    {t("custom_prefix")} {t("pump_label")}
                                </Label>
                            </div>
                            <span className="ml-auto font-mono text-lg font-bold text-primary">
                                {cableLengths.waterPump || 3}m
                            </span>
                        </div>
                        <Slider
                            value={[cableLengths.waterPump || 3]}
                            min={1}
                            max={15}
                            step={0.5}
                            onValueChange={(val) => updateLength('waterPump', val[0])}
                            className="py-2"
                        />
                    </div>
                )}

                {/* --- DYNAMIC CONSUMERS --- */}
                {dynamicConsumers.length > 0 && (
                    <>
                        <div className="border-t my-4" />
                        <h3 className="text-lg font-semibold tracking-tight">Individuelle Kabelwege</h3>
                        {dynamicConsumers.map(consumer => {
                            const length = cableLengths.custom?.[consumer.id] || 3;
                            return (
                                <div key={consumer.id} className="space-y-4 p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Plug2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <Label className="text-base font-semibold truncate block">
                                                {t("custom_prefix")} {consumer.name}
                                            </Label>
                                        </div>
                                        <span className="ml-auto font-mono text-lg font-bold text-primary shrink-0">
                                            {length}m
                                        </span>
                                    </div>
                                    <Slider
                                        value={[length]}
                                        min={0.5}
                                        max={12}
                                        step={0.5}
                                        onValueChange={(val) => setCustomCableLength(consumer.id, val[0])}
                                        className="py-2"
                                    />
                                </div>
                            );
                        })}
                    </>
                )}

            </div>
        </div>
    );
}
