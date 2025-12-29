"use client";

import * as React from "react";
import { useWizardStore, type Consumer, type SimultaneousLoad } from "@/lib/store/wizard-store";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Copy, Search, Sparkles, Loader2, AlertCircle, Lightbulb, Laptop, Zap, Info } from "lucide-react";
import { DeviceSearchModal } from "../device-search-modal";
import { CardSelection } from "@/components/ui/card-selection";
import type { PresetDevice } from "@/lib/data/preset-devices";

// Types matching the API response
interface ApiConsumerDevice {
    id: string;
    name: string;
    i18nKey?: string | null;
    icon?: string | null;
    defaultPower: number;
    defaultVoltage: string;
    defaultHoursPerDay: number;
    stepHours: number;
    showHoursField: boolean;
    showFixedOption: boolean;
    isCooling: boolean;
    keywords: string[];
    sortOrder: number;
    categoryId: string;
    isFeatured: boolean;
}

interface ApiConsumerCategory {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    sortOrder: number;
    devices: ApiConsumerDevice[];
}

// Section header component for sticky behavior
function SectionHeader({
    title,
    count,
    isActive,
    sectionRef,
    icon
}: {
    title: string;
    count: number;
    isActive: boolean;
    sectionRef: (el: HTMLElement | null) => void;
    icon?: React.ReactNode;
}) {
    return (
        <div
            ref={sectionRef}
            className={cn(
                "sticky top-0 z-10 py-3 -mx-4 px-4",
                "bg-background/95 backdrop-blur-sm",
                "border-b transition-all duration-300",
                isActive ? "border-primary/30" : "border-transparent"
            )}
        >
            <h3 className="text-lg font-medium flex items-center gap-2">
                {icon && <span className="text-xl">{icon}</span>}
                {title}
                <span className="text-sm font-normal text-muted-foreground">({count})</span>
            </h3>
        </div>
    );
}

export function Step4Consumers() {
    const t = useTranslations("Wizard.Step4");
    const { consumers, toggleConsumer, updateConsumer, addConsumer, removeConsumer, systemVoltage, simultaneousLoad, setSimultaneousLoad, syncConsumers } = useWizardStore();

    // Data State
    const [categories, setCategories] = React.useState<ApiConsumerCategory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Modal & custom form state
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [showCustomForm, setShowCustomForm] = React.useState(false);

    // Form state for new custom device
    const [customName, setCustomName] = React.useState("");
    const [customPower, setCustomPower] = React.useState(100);
    const [customVoltage, setCustomVoltage] = React.useState<Consumer['voltage']>(systemVoltage);
    const [customHours, setCustomHours] = React.useState(2);
    const [customIsFixed, setCustomIsFixed] = React.useState(false);

    // Section tracking for sticky headers
    const [activeSection, setActiveSection] = React.useState<string>("");
    const sectionRefs = React.useRef<Map<string, HTMLElement>>(new Map());

    // Fetch Data
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/wizard/consumers");
                if (!res.ok) throw new Error("Failed to fetch consumers");
                const data: ApiConsumerCategory[] = await res.json();
                setCategories(data);

                // Sync: Ensure local store matches backend definitions (removes orphans, updates names)
                if (Array.isArray(data)) {
                    const allDevices = data.flatMap(c => c.devices.map(d => ({
                        id: d.id,
                        name: d.i18nKey ? t(`Consumers.${d.i18nKey}`) : d.name
                    })));
                    syncConsumers(allDevices);
                }

                if (data.length > 0) setActiveSection(data[0].slug);
            } catch (err) {
                console.error(err);
                setError("Fehler beim Laden der Verbraucher.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []); // Sync only once on mount (or when translations change - but t is stable enough usually)

    // Auto-correct consumer voltages when system voltage changes
    // This fixes stale state (e.g. 12V device in 24V system) and ensures visual selection works
    React.useEffect(() => {
        consumers.forEach(c => {
            // Skip 230V devices (they are independent of system voltage)
            if (c.voltage === '230V') return;

            // If voltage doesn't match system voltage, migrate it
            if (c.voltage !== systemVoltage) {
                updateConsumer(c.id, { voltage: systemVoltage });
            }
        });
    }, [systemVoltage, consumers, updateConsumer]);

    // IntersectionObserver for sticky header detection
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.getAttribute("data-section");
                        if (sectionId) {
                            setActiveSection(sectionId);
                        }
                    }
                });
            },
            { rootMargin: "-100px 0px -80% 0px", threshold: 0 }
        );

        sectionRefs.current.forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [categories]); // Re-run when categories load

    const setSectionRef = (sectionId: string) => (el: HTMLElement | null) => {
        if (el) {
            el.setAttribute("data-section", sectionId);
            sectionRefs.current.set(sectionId, el);
        }
    };

    const getConsumer = (id: string) => consumers.find((c) => c.id === id);
    const isSelected = (id: string) => !!getConsumer(id);

    // Voltage options: system voltage + 230V
    const voltageOptions = [
        { value: systemVoltage, label: systemVoltage },
        { value: "230V" as const, label: "230V" },
    ];

    // Cooling method options
    const coolingMethodOptions = [
        { value: "compressor" as const, label: t("CoolingMethod.compressor") },
        { value: "absorber" as const, label: t("CoolingMethod.absorber") },
    ];

    const getDisplayName = (device: ApiConsumerDevice) => {
        return device.i18nKey ? t(`Consumers.${device.i18nKey}`) : device.name;
    };

    const handleToggle = (device: ApiConsumerDevice, categorySlug: string) => {
        const consumer: Consumer = {
            id: device.id,
            category: categorySlug,
            name: getDisplayName(device),
            power: device.defaultPower,
            // If device default is 230V, keep it. Otherwise (12V/24V/etc), adapt to system voltage.
            voltage: device.defaultVoltage === '230V' ? '230V' : systemVoltage,
            usageHoursPerDay: device.defaultHoursPerDay,
            usage: "medium",
            isFixed: device.showFixedOption ? false : false, // Default false, user can enable
            ...(device.isCooling && { coolingMethod: "compressor" as const }),
        };
        toggleConsumer(consumer);
    };

    const handleDuplicate = (consumer: Consumer, displayName?: string) => {
        const name = displayName || consumer.name;
        const newConsumer: Consumer = {
            ...consumer,
            id: `${consumer.id}_copy_${Date.now()}`,
            name: `${name} (Kopie)`,
        };
        addConsumer(newConsumer);
    };

    const handleAddCustom = () => {
        if (!customName || customPower <= 0) return;

        const newConsumer: Consumer = {
            id: `custom_${Date.now()}`,
            category: "custom",
            name: customName,
            power: customPower,
            voltage: customVoltage,
            usageHoursPerDay: customHours,
            usage: "medium",
            isFixed: customIsFixed
        };
        addConsumer(newConsumer);
        setCustomName("");
        setCustomPower(100);
        setCustomHours(2);
        setCustomIsFixed(false);
        setShowCustomForm(false);
    };

    const handleAddPresetDevices = (devices: PresetDevice[]) => {
        devices.forEach(device => {
            const newConsumer: Consumer = {
                id: `preset_${device.id}_${Date.now()}`,
                category: "custom",
                name: device.name,
                power: device.defaultPower,
                voltage: device.defaultVoltage === '230V' ? '230V' : systemVoltage,
                usageHoursPerDay: device.defaultHours,
                usage: "medium",
                isFixed: false,
            };
            addConsumer(newConsumer);
        });
    };

    const customConsumers = consumers.filter(c => c.category === "custom");

    // Helper to convert API device to PresetDevice for Search Modal (non-featured only)
    const allDevicesForSearch: PresetDevice[] = React.useMemo(() => {
        return categories.flatMap(cat => cat.devices
            .filter(d => !d.isFeatured) // Only show non-featured devices in search
            .map(d => ({
                id: d.id,
                name: getDisplayName(d),
                category: cat.slug,
                defaultPower: d.defaultPower,
                defaultVoltage: d.defaultVoltage as any,
                defaultHours: d.defaultHoursPerDay,
                icon: d.icon || "⚡",
                keywords: d.keywords
            })));
    }, [categories]); // Warning: t function dependency missing but stable in next-intl usually

    // Reusable sub-component for consumer details
    const ConsumerDetails = ({
        consumer,
        def,
        isDuplicate = false,
        onDuplicate
    }: {
        consumer: Consumer,
        def?: ApiConsumerDevice,
        isDuplicate?: boolean,
        onDuplicate: (c: Consumer) => void
    }) => {
        const stepHours = def?.stepHours ?? 0.5;
        const safeHours = typeof consumer.usageHoursPerDay === 'number' && !isNaN(consumer.usageHoursPerDay)
            ? consumer.usageHoursPerDay
            : (def?.defaultHoursPerDay ?? 0);

        return (
            <div className={cn("mt-3 pt-3 border-t border-dashed space-y-4", isDuplicate && "ml-0")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Voltage Selection */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("custom.voltage_label")}</Label>
                        <SegmentedControl
                            options={voltageOptions}
                            value={consumer.voltage}
                            onChange={(v) => updateConsumer(consumer.id, { voltage: v as Consumer['voltage'] })}
                            size="sm"
                            className="w-full"
                        />
                    </div>

                    {/* Cooling Method */}
                    {def?.isCooling && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("CoolingMethod.label")}</Label>
                            <SegmentedControl
                                options={coolingMethodOptions}
                                value={consumer.coolingMethod || "compressor"}
                                onChange={(v) => updateConsumer(consumer.id, { coolingMethod: v as Consumer['coolingMethod'] })}
                                size="sm"
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Hours Selection */}
                    {def?.showHoursField !== false && !def?.isCooling && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("custom.hours_label")}</Label>
                            <NumberStepper
                                value={safeHours}
                                onChange={(v) => updateConsumer(consumer.id, { usageHoursPerDay: v })}
                                min={0}
                                max={24}
                                step={stepHours}
                                suffix="h"
                            />
                        </div>
                    )}

                    {/* Fixed Installation Toggle */}
                    {def?.showFixedOption && (
                        <div className="sm:col-span-2 flex items-center space-x-2 border p-2 rounded-md bg-muted/20">
                            <Checkbox
                                id={`fixed-${consumer.id}`}
                                checked={!!consumer.isFixed}
                                onCheckedChange={(c) => updateConsumer(consumer.id, { isFixed: c as boolean })}
                            />
                            <Label
                                htmlFor={`fixed-${consumer.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                {t("is_fixed_label")}
                            </Label>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-9 px-3 gap-1.5 ml-auto"
                        onClick={() => onDuplicate(consumer)}
                    >
                        <Copy className="h-4 w-4" />
                        {t("actions.duplicate")}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3"
                        onClick={() => removeConsumer(consumer.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Lade Verbraucher...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p>{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Erneut versuchen</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>

                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Info className="h-4 w-4" />
                    {t("hint_add_later")}
                </div>
            </div>

            {/* Category Sections */}
            <div className="space-y-8">
                {categories.map((cat) => {
                    // Count only featured devices for the section header
                    const featuredDevices = cat.devices.filter(d => d.isFeatured);
                    const categoryConsumers = consumers.filter(c => c.category === cat.slug);

                    return (
                        <section key={cat.id}>
                            <SectionHeader
                                title={cat.name}
                                count={categoryConsumers.length}
                                isActive={activeSection === cat.slug}
                                sectionRef={setSectionRef(cat.slug)}
                                icon={cat.icon}
                            />

                            {/* Only show featured devices in sections */}
                            <div className="grid grid-cols-1 gap-3 pt-4">
                                {cat.devices.filter(d => d.isFeatured).map((device) => {
                                    const selected = isSelected(device.id);
                                    const current = getConsumer(device.id);
                                    // Handle duplicates logic (simple prefix check)
                                    const duplicates = consumers.filter(c =>
                                        c.category === cat.slug && c.id.startsWith(`${device.id}_copy_`)
                                    );

                                    return (
                                        <React.Fragment key={device.id}>
                                            <div
                                                className={cn(
                                                    "p-3 rounded-md border transition-all",
                                                    selected
                                                        ? "bg-primary/5 border-primary shadow-sm"
                                                        : "bg-background border-muted"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Checkbox
                                                        checked={selected}
                                                        onCheckedChange={() => handleToggle(device, cat.slug)}
                                                        id={device.id}
                                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-6 w-6 mt-1 self-start sm:self-center sm:mt-0"
                                                    />
                                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 relative">
                                                        <label htmlFor={device.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                                                            <span className="text-2xl">{device.icon}</span>
                                                            <span className="font-medium">{getDisplayName(device)}</span>
                                                        </label>

                                                        {/* --- HINT FOR LED - HARDCODED CHECK, COULD BE DYNAMIC LATER --- */}
                                                        {device.i18nKey === 'led' && (
                                                            <div className="absolute top-8 left-10 sm:left-14 text-xs text-muted-foreground italic w-full">
                                                                {t("Consumers.led_hint")}
                                                            </div>
                                                        )}

                                                        {selected ? (
                                                            <div className="mt-2 sm:mt-0">
                                                                <NumberStepper
                                                                    value={current?.power ?? device.defaultPower}
                                                                    onChange={(v) => updateConsumer(device.id, { power: v })}
                                                                    min={1}
                                                                    max={5000}
                                                                    step={device.defaultPower >= 100 ? 50 : 5}
                                                                    suffix="W"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground sm:px-3">~{device.defaultPower} W</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {selected && current && (
                                                    <ConsumerDetails
                                                        consumer={current}
                                                        def={device}
                                                        onDuplicate={(c) => handleDuplicate(c, getDisplayName(device))}
                                                    />
                                                )}
                                            </div>

                                            {duplicates.map((c) => (
                                                <div key={c.id} className="p-3 rounded-md border bg-primary/5 border-primary/50 shadow-sm ml-4 sm:ml-8 relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-l-md" />
                                                    <div className="flex items-center gap-4 pl-2">
                                                        <div className="h-6 w-6 flex items-center justify-center text-primary/70 mt-1 self-start sm:self-center sm:mt-0">
                                                            <Copy className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                            <span className="font-medium flex-1">{c.name}</span>
                                                            <div className="mt-2 sm:mt-0">
                                                                <NumberStepper
                                                                    value={c.power}
                                                                    onChange={(v) => updateConsumer(c.id, { power: v })}
                                                                    min={1}
                                                                    max={5000}
                                                                    step={c.power >= 100 ? 50 : 5}
                                                                    suffix="W"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <ConsumerDetails
                                                        consumer={c}
                                                        def={device}
                                                        isDuplicate={true}
                                                        onDuplicate={handleDuplicate}
                                                    />
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {/* Custom Devices Section */}
                <section>
                    <SectionHeader
                        title={t("Categories.custom")}
                        count={customConsumers.length}
                        isActive={activeSection === "custom"}
                        sectionRef={setSectionRef("custom")}
                        icon="✨"
                    />

                    <div className="pt-4 space-y-4">
                        {/* Buttons for adding devices */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => setIsModalOpen(true)}
                                className="flex-1 gap-2 h-12"
                            >
                                <Search className="h-5 w-5" />
                                {t("custom.add_device_button")}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowCustomForm(!showCustomForm)}
                                className="gap-2 h-12"
                            >
                                <Sparkles className="h-4 w-4" />
                                {t("custom.add_individual_button")}
                            </Button>
                        </div>

                        {/* Custom Device Form (collapsible) */}
                        {showCustomForm && (
                            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-dashed animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <Label htmlFor="custom-name" className="text-sm font-medium">{t("custom.name_label")}</Label>
                                    <Input
                                        id="custom-name"
                                        placeholder={t("custom.name_placeholder")}
                                        value={customName}
                                        onChange={e => setCustomName(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">{t("custom.power_label")}</Label>
                                        <NumberStepper
                                            value={customPower}
                                            onChange={setCustomPower}
                                            min={1}
                                            max={5000}
                                            step={customVoltage === '230V' ? 50 : 10}
                                            suffix="W"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">{t("custom.voltage_label")}</Label>
                                        <SegmentedControl
                                            options={voltageOptions}
                                            value={customVoltage}
                                            onChange={(v) => setCustomVoltage(v as Consumer['voltage'])}
                                            size="sm"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">{t("custom.hours_label")}</Label>
                                        <NumberStepper
                                            value={customHours}
                                            onChange={setCustomHours}
                                            min={0.5}
                                            max={24}
                                            step={0.5}
                                            suffix="h"
                                        />
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <div className="flex items-center space-x-2 w-full p-2 rounded-md border bg-background">
                                            <Checkbox
                                                id="new-custom-fixed"
                                                checked={customIsFixed}
                                                onCheckedChange={(c) => setCustomIsFixed(!!c)}
                                            />
                                            <Label htmlFor="new-custom-fixed" className="text-sm cursor-pointer flex-1">
                                                {t("is_fixed_label")}
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCustomForm(false)}
                                        className="flex-1 h-12"
                                    >
                                        {t("custom.cancel")}
                                    </Button>
                                    <Button
                                        onClick={handleAddCustom}
                                        disabled={!customName || customPower <= 0}
                                        className="flex-1 gap-2 h-12"
                                    >
                                        <Plus className="h-5 w-5" />
                                        {t("custom.add_button")}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* List Custom Devices */}
                        {customConsumers.length > 0 && (
                            <div className="space-y-3">
                                {customConsumers.map((c) => (
                                    <div key={c.id} className="p-4 rounded-lg border bg-background space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full text-primary text-xl shrink-0">✨</div>
                                            <div className="flex-1 font-medium text-lg truncate">{c.name}</div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-10 w-10"
                                                onClick={() => removeConsumer(c.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        <div className="pt-3 border-t border-dashed">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">{t("custom.power_label")}</Label>
                                                    <NumberStepper
                                                        value={c.power}
                                                        onChange={(v) => updateConsumer(c.id, { power: v })}
                                                        min={1}
                                                        max={5000}
                                                        step={c.voltage === '230V' ? 50 : 10}
                                                        suffix="W"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">{t("custom.voltage_label")}</Label>
                                                    <SegmentedControl
                                                        options={voltageOptions}
                                                        value={c.voltage}
                                                        onChange={(v) => updateConsumer(c.id, { voltage: v as Consumer['voltage'] })}
                                                        size="sm"
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">{t("custom.hours_label")}</Label>
                                                    <NumberStepper
                                                        value={c.usageHoursPerDay}
                                                        onChange={(v) => updateConsumer(c.id, { usageHoursPerDay: v })}
                                                        min={0}
                                                        max={24}
                                                        step={0.5}
                                                        suffix="h"
                                                    />
                                                </div>
                                                <div className="flex items-end pb-1">
                                                    <div className="flex items-center space-x-2 w-full p-2 rounded-md border bg-muted/20">
                                                        <Checkbox
                                                            id={`custom-fixed-${c.id}`}
                                                            checked={!!c.isFixed}
                                                            onCheckedChange={(val) => updateConsumer(c.id, { isFixed: !!val })}
                                                        />
                                                        <Label htmlFor={`custom-fixed-${c.id}`} className="text-sm cursor-pointer flex-1">
                                                            {t("is_fixed_label")}
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-10 gap-2 mt-4"
                                                onClick={() => handleDuplicate(c)}
                                            >
                                                <Copy className="h-4 w-4" />
                                                {t("actions.duplicate")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Simultaneous Load Question */}
            <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold">{t("simultaneous_title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("simultaneous_hint")}</p>
                </div>

                <CardSelection
                    options={[
                        { value: "low", title: t("simultaneous_options.low"), description: t("simultaneous_options.low_desc"), icon: <Lightbulb className="h-5 w-5" /> },
                        { value: "moderate", title: t("simultaneous_options.moderate"), description: t("simultaneous_options.moderate_desc"), icon: <Laptop className="h-5 w-5" /> },
                        { value: "high", title: t("simultaneous_options.high"), description: t("simultaneous_options.high_desc"), icon: <Zap className="h-5 w-5" /> },
                    ]}
                    value={simultaneousLoad}
                    onChange={(val) => setSimultaneousLoad(val as SimultaneousLoad)}
                    columns={3}
                />
            </div>

            {/* Device Search Modal */}
            <DeviceSearchModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onAddDevices={handleAddPresetDevices}
                systemVoltage={systemVoltage}
                availableDevices={allDevicesForSearch}
            />
        </div>
    );
}
