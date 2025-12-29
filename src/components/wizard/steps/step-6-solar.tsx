"use client";

import { useTranslations } from "next-intl";
import { useWizardStore, SolarSetupType, RoofModuleType, RoofAreaName } from "@/lib/store/wizard-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sun, Briefcase, Layers, Plus, Trash2, Lightbulb } from "lucide-react";
import { CardSelection } from "@/components/ui/card-selection";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Step6Solar() {
    const t = useTranslations("Wizard.Step7");
    const {
        roofAreas, addRoofArea, updateRoofArea, removeRoofArea,
        solarSetupType, setSolarSetupType,
        roofModuleType, setRoofModuleType,
        solarBags, addSolarBag, removeSolarBag
    } = useWizardStore();

    // Local state for new bag input
    const [newBagPower, setNewBagPower] = React.useState<string>("");
    const [showBagForm, setShowBagForm] = React.useState(false);

    // Handle Mode Change
    const handleModeChange = (val: string) => {
        const type = val as SolarSetupType;
        setSolarSetupType(type);
    };

    const handleAddBag = () => {
        const power = parseInt(newBagPower);
        if (!isNaN(power) && power > 0) {
            addSolarBag({
                id: Math.random().toString(36).substr(2, 9),
                power
            });
            setNewBagPower("");
            setShowBagForm(false);
        }
    };

    const modeOptions = [
        {
            value: "roof",
            title: t("mode_roof"),
            icon: <Sun className="h-6 w-6" />,
            description: "Klassisch auf dem Dach"
        },
        {
            value: "mixed",
            title: t("mode_mixed"),
            icon: <Layers className="h-6 w-6" />,
            description: "Dach + Mobil"
        },
        {
            value: "portable",
            title: t("mode_portable"),
            icon: <Briefcase className="h-6 w-6" />,
            description: "Nur mobile Tasche"
        }
    ];

    const areaNameOptions: { value: RoofAreaName; label: string }[] = [
        { value: 'main', label: t("area_names.main") },
        { value: 'front', label: t("area_names.front") },
        { value: 'rear', label: t("area_names.rear") },
        { value: 'left', label: t("area_names.left") },
        { value: 'right', label: t("area_names.right") },
    ];

    const bagPowerOptions = [100, 120, 140, 160, 180, 200, 220, 300, 400];

    const showRoofConfig = solarSetupType === 'roof' || solarSetupType === 'mixed';
    const showPortableConfig = solarSetupType === 'portable' || solarSetupType === 'mixed';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>

            {/* 1. Installation Mode */}
            <div className="space-y-3">
                <Label className="text-base">{t("mode_label")}</Label>
                <CardSelection
                    options={modeOptions}
                    value={solarSetupType}
                    onChange={handleModeChange}
                    columns={3}
                />
            </div>

            {/* 2. Roof Configuration */}
            {showRoofConfig && (
                <div className="space-y-8 pt-4 border-t animate-in fade-in slide-in-from-top-4">

                    {/* Module Type Checkbox/Cards */}
                    <div className="space-y-3">
                        <Label className="text-base">{t("roof_type_label")}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent",
                                    roofModuleType === 'rigid' ? "border-primary bg-accent" : "border-muted-foreground/20"
                                )}
                                onClick={() => setRoofModuleType('rigid')}
                            >
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    <div className="h-4 w-4 rounded-full border border-primary bg-primary" />
                                    {t("roof_rigid")}
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{t("roof_rigid_desc")}</p>
                            </div>

                            <div
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent",
                                    roofModuleType === 'flexible' ? "border-primary bg-accent" : "border-muted-foreground/20"
                                )}
                                onClick={() => setRoofModuleType('flexible')}
                            >
                                <div className="font-semibold flex items-center gap-2 mb-1">
                                    {/* Radio indicator simulation */}
                                    <div className={cn("h-4 w-4 rounded-full border border-primary", roofModuleType === 'flexible' && "bg-primary")} />
                                    {t("roof_flexible")}
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{t("roof_flexible_desc")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Roof Areas Section */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-base">{t("area_title")}</Label>
                            <p className="text-sm text-muted-foreground">{t("area_subtitle")}</p>
                        </div>

                        {/* Area Cards */}
                        <div className="space-y-4">
                            {roofAreas.map((area, index) => {
                                return (
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
                                                    <Label>{t("length")}</Label>
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
                                                    <Label>{t("width")}</Label>
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
                                );
                            })}
                        </div>

                        {/* Add Area Button */}
                        <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={addRoofArea}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("area_add")}
                        </Button>

                        {/* Hint */}
                        <div className="flex gap-4 p-4 border rounded-lg bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                            <Lightbulb className="h-5 w-5 flex-shrink-0" />
                            <div className="space-y-1">
                                <h5 className="font-medium leading-none tracking-tight">{t("warning_title")}</h5>
                                <div className="text-sm opacity-90">
                                    {t("warning_desc")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Portable Bag Configuration */}
            {showPortableConfig && (
                <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-1">
                        <Label className="text-base">{t("bag_title")}</Label>
                        <p className="text-sm text-muted-foreground">{t("bag_subtitle")}</p>
                    </div>

                    {solarBags.length > 0 ? (
                        <div className="grid gap-3">
                            <Label>{t("bag_list_title")}</Label>
                            {solarBags.map(bag => (
                                <div key={bag.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                        <span className="font-semibold">{bag.power} W</span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeSolarBag(bag.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic p-2 border border-dashed rounded-lg text-center">
                            {t("bag_empty")}
                        </div>
                    )}

                    {!showBagForm ? (
                        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowBagForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("bag_add")}
                        </Button>
                    ) : (
                        <div className="flex gap-3 items-end p-4 border rounded-lg bg-muted/30 animate-in zoom-in-95 duration-200">
                            <div className="flex-1 space-y-2">
                                <Label>{t("bag_power_label")}</Label>
                                <Select onValueChange={setNewBagPower} value={newBagPower}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="Bitte wählen..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bagPowerOptions.map((watts) => (
                                            <SelectItem key={watts} value={watts.toString()}>
                                                {watts} Watt
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddBag} disabled={!newBagPower}>
                                Hinzufügen
                            </Button>
                            <Button variant="ghost" onClick={() => setShowBagForm(false)}>
                                Abbrechen
                            </Button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

import React from "react";
