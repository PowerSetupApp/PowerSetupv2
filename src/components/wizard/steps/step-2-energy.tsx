"use client";

import * as React from "react";
import { useWizardStore, type EnergySource, type AlternatorSize, type ShoreChargingSpeed, type RoofModuleType, type RoofAreaName } from "@/lib/store/wizard-store";
import { IconButton, type IconButtonOption } from "@/components/ui/icon-button";
import { CardSelection } from "@/components/ui/card-selection";
import { useTranslations } from "next-intl";
import { Zap, Battery, Gauge, HelpCircle, Clock, Timer, Bolt, Plus, Trash2, Lightbulb } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { getAlgorithmSettings, type AlgorithmSettingsData } from "@/app/actions/algorithm-settings";

export function Step2Energy() {
    const {
        energySources,
        setEnergySources,
        alternatorSize,
        setAlternatorSize,
        shoreChargingSpeed,
        setShoreChargingSpeed,
        // Solar configuration
        roofAreas,
        addRoofArea,
        updateRoofArea,
        removeRoofArea,
        roofModuleType,
        setRoofModuleType
    } = useWizardStore();
    const t = useTranslations("Wizard.Step3");
    const tSolar = useTranslations("Wizard.Step7"); // Solar translations

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

    const areaNameOptions: { value: RoofAreaName; label: string }[] = [
        { value: 'main', label: tSolar("area_names.main") },
        { value: 'front', label: tSolar("area_names.front") },
        { value: 'rear', label: tSolar("area_names.rear") },
        { value: 'left', label: tSolar("area_names.left") },
        { value: 'right', label: tSolar("area_names.right") },
    ];

    const showAlternatorQuestion = energySources.includes("alternator");
    const showShoreChargingQuestion = energySources.includes("shore_power");
    const showSolarConfig = energySources.includes("solar");

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

            {/* Conditional: Solar Configuration */}
            {showSolarConfig && (
                <div className="space-y-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">{tSolar("title")}</h3>
                        <p className="text-sm text-muted-foreground">{tSolar("subtitle")}</p>
                    </div>

                    {/* Module Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-base">{tSolar("roof_type_label")}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent",
                                    roofModuleType === 'rigid' ? "border-primary bg-accent" : "border-muted-foreground/20"
                                )}
                                onClick={() => setRoofModuleType('rigid')}
                            >
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <div className={cn("h-4 w-4 rounded-full border border-primary", roofModuleType === 'rigid' && "bg-primary")} />
                                    {tSolar("roof_rigid")}
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{tSolar("roof_rigid_desc")}</p>
                            </div>

                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent",
                                    roofModuleType === 'flexible' ? "border-primary bg-accent" : "border-muted-foreground/20"
                                )}
                                onClick={() => setRoofModuleType('flexible')}
                            >
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <div className={cn("h-4 w-4 rounded-full border border-primary", roofModuleType === 'flexible' && "bg-primary")} />
                                    {tSolar("roof_flexible")}
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{tSolar("roof_flexible_desc")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Roof Areas Section */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-base">{tSolar("area_title")}</Label>
                            <p className="text-sm text-muted-foreground">{tSolar("area_subtitle")}</p>
                        </div>

                        {/* Area Cards */}
                        <div className="space-y-4">
                            {roofAreas.map((area) => (
                                <div
                                    key={area.id}
                                    className="p-4 border rounded-xl bg-card space-y-4 animate-in zoom-in-95 duration-200"
                                >
                                    {/* Area Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Select
                                                value={area.name}
                                                onValueChange={(val) => updateRoofArea(area.id, { name: val as RoofAreaName })}
                                            >
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {areaNameOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {roofAreas.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeRoofArea(area.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Dimensions Sliders */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <Label>{tSolar("length")}</Label>
                                                <span className="font-mono text-muted-foreground">{area.length} cm</span>
                                            </div>
                                            <Slider
                                                value={[area.length]}
                                                min={50}
                                                max={800}
                                                step={10}
                                                onValueChange={(val) => updateRoofArea(area.id, { length: val[0] })}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <Label>{tSolar("width")}</Label>
                                                <span className="font-mono text-muted-foreground">{area.width} cm</span>
                                            </div>
                                            <Slider
                                                value={[area.width]}
                                                min={50}
                                                max={250}
                                                step={10}
                                                onValueChange={(val) => updateRoofArea(area.id, { width: val[0] })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Area Button */}
                        <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={addRoofArea}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {tSolar("area_add")}
                        </Button>

                        {/* Hint */}
                        <div className="flex gap-4 p-4 border rounded-lg bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                            <Lightbulb className="h-5 w-5 flex-shrink-0" />
                            <div className="space-y-1">
                                <h5 className="font-medium leading-none tracking-tight">{tSolar("warning_title")}</h5>
                                <div className="text-sm opacity-90">
                                    {tSolar("warning_desc")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

