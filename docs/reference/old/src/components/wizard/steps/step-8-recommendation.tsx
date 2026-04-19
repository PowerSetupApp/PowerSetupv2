"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useWizardStore } from "@/lib/store/wizard-store";
import { testAlgorithmCalculations } from "@/app/actions/test-algorithm";
import { type SystemRequirements } from "@/lib/algorithm";
import { MAX_PORTABLE_WP } from "@/lib/algorithm/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Battery, Calculator, Check, Info, RotateCcw, Settings2, Sun, Zap, Bug, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { InfoModal } from "@/components/ui/info-modal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendationAdjustmentInput } from "@/components/wizard/recommendation-adjustment-input";

export function Step8Recommendation() {
    const t = useTranslations("Wizard.Step10"); // We'll need to add translations or just hardcode German for now as per user request
    const {
        vehicleType,
        vehicleVoltage,
        systemVoltage,
        energySources,
        consumers,
        autarchyGoal,
        autarchyDays,
        solarSetupType,
        solarDimensions,
        roofModuleType,
        solarModulePreference,
        solarBags,
        cableLengths,
        comfortLevel,
        schematicPreference,
        batteryPreference,
        travelBehavior,
        simultaneousLoad,
        batterySpaceSize,
        roofAreas,
        shoreChargingSpeed,

        // Custom setters
        setCustomBatteryCapacity,
        setCustomSolarPower,
        setCustomBoosterCurrent,
        setCustomSolarControllerCurrent,

        // Current custom values
        customBatteryCapacity,
        customSolarPower,
        customBoosterCurrent,
        customSolarControllerCurrent,

        customInverterPower,
        setCustomInverterPower,
        customChargerCurrent,
        setCustomChargerCurrent,

        // Actions
        addSolarBag,
        removeSolarBag,
        clearSolarBags,
        setSolarSetupType
    } = useWizardStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [calculations, setCalculations] = useState<SystemRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    // Calculate portable solar controller when solar bags are present
    const portableSolarController = useMemo(() => {
        if (solarBags.length === 0) return null;

        const totalPortableWp = solarBags.reduce((sum, bag) => sum + bag.power, 0);
        const safetyFactor = 1.10; // SOLAR_CONTROLLER_SAFETY
        const rawCurrentA = totalPortableWp / systemVoltage;
        const bufferedCurrentA = rawCurrentA * safetyFactor;

        // No rounding to standard sizes - AI will pick appropriate products
        const recommendedCurrentA = Math.ceil(bufferedCurrentA);

        return {
            totalWp: totalPortableWp,
            rawCurrentA: Math.round(rawCurrentA * 10) / 10,
            recommendedCurrentA,
        };
    }, [solarBags, systemVoltage]);

    // Filter out functions and only keep data for debug view
    const debugData = {
        vehicleType,
        vehicleVoltage,
        systemVoltage,
        energySources,
        consumers: consumers.map(c => ({
            id: c.id,
            name: c.name,
            power: c.power,
            daily: c.usageHoursPerDay,
            voltage: c.voltage,
            coolingMethod: c.coolingMethod,
            usesGas: c.usesGas,
            electricPercentage: c.electricPercentage
        })),
        autarchyGoal,
        autarchyDays,
        solarSetupType,
        solarDimensions,
        roofModuleType,
        solarModulePreference,
        solarBags,
        cableLengths,
        comfortLevel,
        schematicPreference,
        batteryPreference,
        travelBehavior,
        simultaneousLoad,
        batterySpaceSize,
        roofAreas,
        customOverrides: {
            battery: customBatteryCapacity,
            solar: customSolarPower,
            booster: customBoosterCurrent,
            controller: customSolarControllerCurrent,
            inverter: customInverterPower,
            charger: customChargerCurrent
        },
        // Results
        calculations: calculations ? {
            battery: calculations.battery,
            solar: calculations.solarModules,
            booster: calculations.booster,
            charger: calculations.charger,
            cables: calculations.cables
        } : "Not calculated"
    };

    const lastPayloadRef = useRef<string>("");

    // Initial Calculation
    const calculate = useMemo(() => async (force = false) => {
        // Construct formData for calculation (excluding custom overrides as they don't affect recommendations)
        const formData = {
            vehicleType,
            vehicleVoltage,
            systemVoltage,
            energySources,
            consumers,
            autarchyGoal,
            autarchyDays,
            solarSetupType,
            solarDimensions,
            roofModuleType,
            solarModulePreference,
            solarBags,
            cableLengths,
            comfortLevel,
            schematicPreference,
            batteryPreference,
            travelBehavior,
            simultaneousLoad,
            batterySpaceSize,
            roofAreas: roofAreas && roofAreas.length > 0 ? roofAreas : (solarDimensions ? [{ id: 'main', name: 'Hauptfläche', length: solarDimensions.length, width: solarDimensions.width }] : []),
            shoreChargingSpeed,
            customOverrides: {
                battery: customBatteryCapacity,
                solar: customSolarPower,
                booster: customBoosterCurrent,
                controller: customSolarControllerCurrent,
                inverter: customInverterPower,
                charger: customChargerCurrent
            }
        };

        const payloadStr = JSON.stringify(formData);

        // Skip if payload hasn't changed and not forced
        if (!force && payloadStr === lastPayloadRef.current && calculations) {
            return;
        }

        lastPayloadRef.current = payloadStr;

        // Only show full skeleton load on first load
        if (!calculations) {
            setIsLoading(true);
        } else {
            setIsUpdating(true);
        }

        try {
            const apiPayload = {
                ...formData,
                _timestamp: Date.now(), // Force fresh request
            };

            const result = await testAlgorithmCalculations(apiPayload);
            if (result.success && result.data) {
                setCalculations(result.data);
            } else {
                setError(result.error || "Fehler bei der Berechnung");
            }
        } catch (err) {
            console.error(err);
            setError("Berechnungsfehler");
        } finally {
            setIsLoading(false);
            setIsUpdating(false);
        }
    }, [
        vehicleType, vehicleVoltage, systemVoltage, energySources, consumers,
        autarchyGoal, autarchyDays, solarSetupType, solarDimensions,
        roofModuleType, solarModulePreference, solarBags, cableLengths,
        comfortLevel, schematicPreference, batteryPreference,
        travelBehavior.season, travelBehavior.tripDuration, travelBehavior.winterLocation, travelBehavior.standingDuration,
        simultaneousLoad, batterySpaceSize, roofAreas, shoreChargingSpeed,
        customBatteryCapacity, customSolarPower, customBoosterCurrent, customSolarControllerCurrent, customInverterPower, customChargerCurrent
        // calculations removed to prevent infinite loop
    ]);

    useEffect(() => {
        calculate(true);
        // Removed window.focus listener to prevent mobile keyboard loops
    }, [calculate]);

    // Sync Solar Controller with Custom Solar Power (ROOF ONLY)
    useEffect(() => {
        if (calculations && customSolarPower !== null) {
            const voltage = calculations.systemVoltage;
            // Get safety factor from settings (via debug info) or default to 1.1 (10%)
            const safetyFactor = calculations.debug?.solarSafetyFactor || 1.1;

            // Calculate ROOF-ONLY power by subtracting portable from total
            const portableWp = calculations.solarModules?.portableWp || 0;
            const roofOnlyPower = Math.max(0, customSolarPower - portableWp);

            // Formula: RoofWp / Voltage * Safety Factor
            const calculatedAmps = (roofOnlyPower / voltage) * safetyFactor;

            // Show the raw calculated value - AI will select appropriate products
            setCustomSolarControllerCurrent(Math.ceil(calculatedAmps));
        }
    }, [customSolarPower, calculations, setCustomSolarControllerCurrent]);

    // Update store handlers are passed directly now

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!calculations) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Deine Empfehlung</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setCustomBatteryCapacity(null);
                            setCustomSolarPower(null);
                            setCustomBoosterCurrent(null);
                            setCustomSolarControllerCurrent(null);
                            setCustomInverterPower(null);
                            setCustomChargerCurrent(null);
                            clearSolarBags();
                        }}
                        disabled={isLoading || isUpdating}
                        title="Alle manuellen Anpassungen zurücksetzen"
                    >
                        <RotateCcw className={`h-4 w-4 ${isLoading || isUpdating ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDebugOpen(true)}
                        title="Debug"
                    >
                        <Bug className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Erfahrene Nutzer können diese Werte hier manuell anpassen.
                </p>
            </div>

            <Alert className="bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Achtung: Experten-Modus</AlertTitle>
                <AlertDescription>
                    Änderungen an diesen Werten beeinflussen direkt die Produktauswahl.
                    Bitte nur ändern, wenn du genau weißt, was du tust!
                </AlertDescription>
            </Alert>

            <div className="grid gap-6">
                {/* ... existing code ... */}
                {/* Battery Section */}
                <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                            <Battery className="h-5 w-5 text-primary" />
                            Batteriekapazität
                        </div>
                        <Badge variant="secondary">{calculations.batteryType.toUpperCase()}</Badge>
                    </div>

                    <div className="space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details" className="border-none">
                                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                    Berechnungs-Details
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2">
                                    {/* Row 1: Daily Wh */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                            <span className="truncate">Tagesbedarf:</span>
                                            <InfoModal title="Tagesbedarf (Wh)" description="Der berechnete Energiebedarf deines Systems für einen ganzen Tag, basierend auf deinen angegebenen Verbrauchern und Nutzungsdauern." />
                                        </div>
                                        <div className="font-medium">{calculations.dailyWh} Wh</div>
                                    </div>

                                    {/* Row 2: Daily Ah */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                            <span className="truncate">Tagesbedarf ({systemVoltage}V):</span>
                                            <InfoModal title="Tagesbedarf (Ah)" description={`Dein Tagesbedarf umgerechnet in Amperestunden bei ${systemVoltage}V Systemspannung. Dies ist die Ladungsmenge, die täglich entnommen wird.`} />
                                        </div>
                                        <div className="font-medium">{Math.round(calculations.dailyWh / systemVoltage)} Ah</div>
                                    </div>

                                    {/* Row 3: Min Ah */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                            <span className="truncate">Bedarf (Schlechtwetter):</span>
                                            <InfoModal title="Bedarf bei Schlechtwetter" description="Die benötigte Batteriekapazität, um deine gewünschten Autarkie-Tage auch ohne nennenswerten Solarertrag (z.B. im Winter oder bei Dauerregen) zu überbrücken." />
                                        </div>
                                        <div className="font-medium">{calculations.battery.minCapacityAh} Ah</div>
                                    </div>

                                    {/* Row 4: Recommended Ah */}
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                            <span className="truncate">Empfohlen:</span>
                                            <InfoModal title="Empfohlene Kapazität" description="Unsere Empfehlung für dein Setup. Sie berücksichtigt Solarerträge, die den täglichen Verbrauch teilweise decken, und spart so Gewicht und Kosten im Vergleich zur reinen Schlechtwetter-Auslegung." />
                                        </div>
                                        <div className="font-bold text-primary">{calculations.battery.recommendedCapacityAh} Ah</div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="battery-override">Empfohlene Kapazität (Ah)</Label>
                                <InfoModal title="Kapazität anpassen" description="Hier kannst du eine eigene Batteriegröße festlegen. Wähle diesen Wert, wenn du bereits eine Batterie besitzt oder spezielle Anforderungen hast." />
                            </div>
                            <RecommendationAdjustmentInput
                                id="battery-override"
                                value={customBatteryCapacity}
                                recommendedValue={calculations.battery.recommendedCapacityAh}
                                onChange={setCustomBatteryCapacity}
                                unit="Ah"
                            />
                        </div>
                    </div>
                </Card>

                {/* Solar Section */}
                {calculations.solarModules && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Sun className="h-5 w-5 text-primary" />
                                Solarleistung {solarSetupType === 'roof' && solarBags.length > 0 ? '(Dach)' : ''}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                                defaultValue={
                                    calculations.solarModules.requiredWp > calculations.solarModules.totalAvailableWp &&
                                        calculations.solarModules.portableWp < MAX_PORTABLE_WP
                                        ? "details"
                                        : undefined
                                }
                            >
                                <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                        Berechnungs-Details
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Benötigt:</span>
                                                <InfoModal title="Benötigte Solarleistung" description="Die Menge an Solarleistung (Wp), die theoretisch nötig ist, um deinen Tagesbedarf im Durchschnitt vollständig durch Sonnenenergie zu decken." />
                                            </div>
                                            <div className="font-medium">{Math.min(
                                                calculations.solarModules.requiredWp,
                                                calculations.solarModules.maxRoofWp + MAX_PORTABLE_WP
                                            )} Wp</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">
                                                    Verfügbar (Dach):
                                                </span>
                                                <InfoModal title="Verfügbare Dach-Leistung" description="Die maximal mögliche Solarleistung auf deinem Dach." />
                                            </div>
                                            <div className="font-medium text-primary">{Math.ceil(calculations.solarModules.maxRoofWp)} Wp</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="solar-override">Geplante Leistung (Dach)</Label>
                                    <InfoModal title="Leistung anpassen" description="Lege fest, wie viel Watt Peak (Wp) du fest auf dem Dach installieren möchtest." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="solar-override"
                                    // Logic: If customSolarPower is set, it represents TOTAL. So Roof = Total - Portable.
                                    value={customSolarPower !== null ? Math.max(0, customSolarPower - (calculations.solarModules?.portableWp || 0)) : null}
                                    recommendedValue={Math.ceil(calculations.solarModules.maxRoofWp)}
                                    // OnChange: User sets Roof. Total = Roof + Portable.
                                    onChange={(newValue) => {
                                        if (newValue === null) {
                                            setCustomSolarPower(null);
                                        } else {
                                            setCustomSolarPower(newValue + (calculations.solarModules?.portableWp || 0));
                                        }
                                    }}
                                    unit="Wp"
                                />
                            </div>
                        </div>

                        {/* Separate Portable Solar Section */}
                        {(solarBags.length > 0 || (calculations.solarModules.requiredWp > calculations.solarModules.totalAvailableWp && calculations.solarModules.portableWp < MAX_PORTABLE_WP)) ? (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Sun className="h-5 w-5 text-amber-500" />
                                            Solarleistung (Solartasche)
                                        </div>
                                        {solarBags.length > 0 && (
                                            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">Separat</Badge>
                                        )}
                                    </div>

                                    {/* Deficit Warning - Buttons moved out */}
                                    {calculations.solarModules.requiredWp > calculations.solarModules.totalAvailableWp &&
                                        calculations.solarModules.portableWp < MAX_PORTABLE_WP && (
                                            <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100">
                                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                <AlertTitle className="mb-2 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                                    Ergänzung empfohlen
                                                </AlertTitle>
                                                <AlertDescription>
                                                    Es fehlen <strong>{Math.min(
                                                        Math.ceil(calculations.solarModules.requiredWp - calculations.solarModules.totalAvailableWp),
                                                        MAX_PORTABLE_WP - calculations.solarModules.portableWp
                                                    )} Wp</strong>. Du kannst mobile Solartaschen ergänzen.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                    {/* List of active bags */}
                                    {solarBags.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                                <span>Aktuelle Solartaschen:</span>
                                                <span className="font-medium text-foreground">{calculations.solarModules.portableWp} Wp</span>
                                            </div>
                                            <div className="space-y-2">
                                                {solarBags.map((bag) => (
                                                    <div key={bag.id} className="flex items-center justify-between p-3 rounded-md border bg-card/50 hover:bg-card/80 transition-colors group">
                                                        <span className="flex items-center gap-2 font-medium">
                                                            <Sun className="h-4 w-4 text-amber-500" />
                                                            Solartasche {bag.power}Wp
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                removeSolarBag(bag.id);
                                                                // Update custom override if set
                                                                if (customSolarPower !== null) {
                                                                    setCustomSolarPower(Math.max(0, customSolarPower - bag.power));
                                                                }
                                                            }}
                                                            title="Entfernen"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Buttons - Always visible in this section */}
                                    <div className="pt-2">
                                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Solartasche hinzufügen:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[100, 200, 300, 400].map((watts) => (
                                                <Button
                                                    key={watts}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 border-dashed border-2 hover:border-solid hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                                                    onClick={() => {
                                                        addSolarBag({
                                                            id: `bag-${Date.now()}-${watts}`,
                                                            power: watts
                                                        });
                                                        if (solarSetupType === 'roof') {
                                                            setSolarSetupType('mixed');
                                                        }
                                                        if (customSolarPower !== null) {
                                                            setCustomSolarPower(customSolarPower + watts);
                                                        }
                                                    }}
                                                >
                                                    {watts}W
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Hidden Section - Show Add Options */
                            <div className="pt-2 space-y-2">
                                <div className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                    Mobile Solartasche hinzufügen:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[100, 200, 300, 400].map((watts) => (
                                        <Button
                                            key={watts}
                                            size="sm"
                                            variant="outline"
                                            className="h-9 border-dashed border-2 hover:border-solid hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                                            onClick={() => {
                                                addSolarBag({
                                                    id: `bag-${Date.now()}-${watts}`,
                                                    power: watts
                                                });
                                                if (solarSetupType === 'roof') {
                                                    setSolarSetupType('mixed');
                                                }
                                                if (customSolarPower !== null) {
                                                    setCustomSolarPower(customSolarPower + watts);
                                                }
                                            }}
                                        >
                                            {watts}W
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Booster Section */}
                {calculations.booster && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Zap className="h-5 w-5 text-primary" />
                                Ladebooster
                            </div>
                            <Badge variant="outline">{calculations.booster.inputVoltage}V → {calculations.booster.outputVoltage}V</Badge>
                        </div>

                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                        Berechnungs-Details
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Lichtmaschine:</span>
                                                <InfoModal title="Lichtmaschine" description="Der Typ der Lichtmaschine in deinem Fahrzeug bestimmt, wie viel Strom maximal abgezweigt werden darf, ohne die Starterbatterie zu gefährden." />
                                            </div>
                                            <div className="font-medium capitalize">{calculations.booster.alternatorType.replace('_', ' ')}</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Empfohlener Strom:</span>
                                                <InfoModal title="Ladebooster Stromstärke" description="Die empfohlene Leistung des Ladeboosters. Sie ist auf deine Lichtmaschine abgestimmt, um eine schnelle Ladung während der Fahrt zu ermöglichen." />
                                            </div>
                                            <div className="font-bold text-primary">{calculations.booster.currentA} A</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="booster-override">Empfohlener Ladestrom (A)</Label>
                                    <InfoModal title="Stromstärke anpassen" description="Wähle eine andere Stärke für den Ladebooster, falls du spezifische Anforderungen hast." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="booster-override"
                                    value={customBoosterCurrent}
                                    recommendedValue={calculations.booster.originalCurrentA ?? calculations.booster.currentA}
                                    onChange={setCustomBoosterCurrent}
                                    unit="A"
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Charger Section */}
                {calculations.charger && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Zap className="h-5 w-5 text-primary" />
                                Batterieladegerät (Landstrom)
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                        Berechnungs-Details
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Ladezeit (0-100%):</span>
                                                <InfoModal title="Ladezeit" description="Die ungefähre Dauer, um die Batterie bei vollständiger Entladung wieder komplett aufzuladen." />
                                            </div>
                                            <div className="font-medium text-muted-foreground">ca. {calculations.charger.chargingTimeHours} Std.</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Empfohlener Strom:</span>
                                                <InfoModal title="Ladestrom" description="Der empfohlene Ladestrom für das 230V Ladegerät, um die Batterie schonend und effektiv zu laden." />
                                            </div>
                                            <div className="font-bold text-primary">{calculations.charger.originalRecommendedCurrentA ?? calculations.charger.recommendedCurrentA} A</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="charger-override">Empfohlener Ladestrom (A)</Label>
                                    <InfoModal title="Stromstärke anpassen" description="Wähle eine andere Stärke für das Ladegerät." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="charger-override"
                                    value={customChargerCurrent}
                                    recommendedValue={calculations.charger.originalRecommendedCurrentA ?? calculations.charger.recommendedCurrentA}
                                    onChange={setCustomChargerCurrent}
                                    unit="A"
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Inverter Section */}
                {calculations.inverter && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Zap className="h-5 w-5 text-primary" />
                                Wechselrichter
                            </div>
                            {/* Type is not in requirement interface, assuming consistent quality */}
                            <Badge variant="outline">Reiner Sinus</Badge>
                        </div>

                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                        Berechnungs-Details
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Max. Last (230V):</span>
                                                <InfoModal title="Maximale Last" description="Die summierte Leistung aller 230V-Geräte, die du gleichzeitig betreiben möchtest." />
                                            </div>
                                            <div className="font-medium">{calculations.inverter.total230VLoadW} W</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Empfohlene Dauerleistung:</span>
                                                <InfoModal title="Empfohlene Dauerleistung" description="Die empfohlene Größe des Wechselrichters Inklusive Sicherheitsreserven für Anlaufströme." />
                                            </div>
                                            <div className="font-bold text-primary">{calculations.inverter.originalRecommendedW ?? calculations.inverter.recommendedW} W</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="inverter-override">Empfohlene Leistung (W)</Label>
                                    <InfoModal title="Leistung anpassen" description="Wähle eine andere Wechselrichter-Größe, falls du z.B. Reserven für künftige Geräte einplanen möchtest." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="inverter-override"
                                    value={customInverterPower}
                                    recommendedValue={calculations.inverter.originalRecommendedW ?? calculations.inverter.recommendedW}
                                    onChange={setCustomInverterPower}
                                    unit="W"
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {/* Solar Controller Section */}
                {calculations.solarController && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Solar-Laderegler {portableSolarController && "(Dach)"}
                            </div>
                            <Badge variant="secondary">{calculations.solarController.type}</Badge>
                        </div>

                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-none">
                                    <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                        Berechnungs-Details
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">PV-Leistung:</span>
                                                <InfoModal title="Geplante PV-Leistung" description="Die Solarleistung, auf die der Laderegler ausgelegt wird. Dies basiert auf deinem Bedarf und der verfügbaren Fläche." />
                                            </div>
                                            <div className="font-medium">{calculations.solarController.totalWp} Wp</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Empfohlener Strom:</span>
                                                <InfoModal title="Empfohlener Strom" description="Der berechnete Strom inkl. Sicherheitsreserve (10%). Die KI wählt später ein passendes Produkt." />
                                            </div>
                                            <div className="font-bold text-primary">{calculations.solarController.recommendedCurrentA} A</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="controller-override">Empfohlener Regler-Strom (A)</Label>
                                    <InfoModal title="Stromstärke anpassen" description="Wähle eine abweichende Ampere-Klasse für den Laderegler." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="controller-override"
                                    value={customSolarControllerCurrent}
                                    recommendedValue={calculations.solarController.originalCurrentA ?? calculations.solarController.currentA}
                                    onChange={setCustomSolarControllerCurrent}
                                    unit="A"
                                />
                            </div>
                        </div>

                        {/* Portable Solar Controller Sub-Section */}
                        {portableSolarController && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Sun className="h-5 w-5 text-amber-500" />
                                            Solar-Laderegler (Solartasche)
                                        </div>
                                        <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">Separat</Badge>
                                    </div>

                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="portable-details" className="border-none">
                                            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                                                Berechnungs-Details
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                        <span className="truncate">Solartaschen:</span>
                                                    </div>
                                                    <div className="font-medium">{solarBags.map(b => `${b.power}Wp`).join(' + ')}</div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                        <span className="truncate">Gesamt-Leistung:</span>
                                                    </div>
                                                    <div className="font-medium">{portableSolarController.totalWp} Wp</div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                        <span className="truncate">Empfohlener Strom:</span>
                                                    </div>
                                                    <div className="font-bold text-amber-600 dark:text-amber-400">{portableSolarController.recommendedCurrentA} A</div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <Alert className="bg-amber-500/10 border-amber-500/30">
                                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <AlertDescription className="text-sm">
                                            Für Solartaschen wird ein <strong>separater Laderegler</strong> benötigt, da diese unabhängig vom Dachsystem betrieben werden.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </>
                        )}
                    </Card>
                )}

                {/* Cables Section */}
                {calculations.cables && calculations.cables.length > 0 && (
                    <Card className="p-6 space-y-4 border-2 border-transparent focus-within:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold">
                                <Zap className="h-5 w-5 text-primary" />
                                Kabel
                            </div>
                            <Badge variant="outline">{calculations.cables.length} Verbindungen</Badge>
                        </div>

                        <div className="space-y-3">
                            {calculations.cables.map((cable, index) => (
                                <div key={cable.route} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{cable.displayName}</span>
                                            {cable.isCritical && (
                                                <Badge variant="destructive" className="text-xs">Kritisch</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value={`cable-${index}`} className="border-none">
                                            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:text-foreground">
                                                Details
                                            </AccordionTrigger>
                                            <AccordionContent className="space-y-2 pt-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Länge:</span>
                                                    <span>{cable.lengthM} m</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Strom:</span>
                                                    <span>{cable.currentA.toFixed(1)} A</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Spannung:</span>
                                                    <span>{cable.voltage} V</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Min. Querschnitt:</span>
                                                    <span>{cable.minCrossSection.toFixed(2)} mm²</span>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-sm text-muted-foreground">Empf. Querschnitt:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary">{cable.recommendedCrossSection} mm²</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Debug: Wizard State</DialogTitle>
                        <DialogDescription>
                            Aktuelle Eingabewerte, die für die Berechnung verwendet werden.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="state" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="state">Wizard State</TabsTrigger>
                            <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
                        </TabsList>
                        <TabsContent value="state">
                            <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-[60vh]">
                                {JSON.stringify(debugData, null, 2)}
                            </div>
                        </TabsContent>
                        <TabsContent value="prompt">
                            <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-[60vh]">
                                {(() => {
                                    if (!calculations) return "Keine Berechnung vorhanden.";

                                    const battCap = customBatteryCapacity ?? calculations.battery.recommendedCapacityAh;

                                    // Calculate split values
                                    const totalSolarWp = customSolarPower ?? Math.ceil(calculations.solarModules?.totalAvailableWp ?? 0);
                                    const portableWp = calculations.solarModules?.portableWp ?? 0;
                                    const roofWp = Math.max(0, totalSolarWp - portableWp);

                                    // Solar Details (Roof)
                                    let roofDetails = "";
                                    if (customSolarPower) {
                                        roofDetails = "- (Manuell festgelegt)";
                                    } else {
                                        if ((calculations.solarModules?.maxRoofWp ?? 0) > 0) {
                                            roofDetails += `- Verfügbare Dachfläche: ${Math.ceil(calculations.solarModules!.maxRoofWp)} Wp\n`;
                                            // Add dimensions if available
                                            if (roofAreas && roofAreas.length > 0) {
                                                roofAreas.forEach((area, idx) => {
                                                    roofDetails += `  - Fläche ${idx + 1}: ${area.length}x${area.width} cm\n`;
                                                });
                                            } else if (solarDimensions) {
                                                roofDetails += `  - Fläche: ${solarDimensions.length}x${solarDimensions.width} cm\n`;
                                            }
                                        }
                                    }

                                    // Portable Details Handled in separate block below

                                    return `
## Batterie
- Typ: ${batteryPreference?.toUpperCase() || 'LIFEPO4'}
- Kapazität: ${battCap} Ah
- Spannung: ${systemVoltage}V

## Solarleistung (Dach)
- Leistung: ${roofWp} Wp
${roofDetails.trim()}
${portableWp > 0 ? `
## Solarleistung (Solartaschen)
- Solartaschen: ${portableWp} Wp
- Konfiguration: ${solarBags.length > 0 ? solarBags.map(b => `${b.power}Wp`).join(' + ') : 'Standard'}
` : ''}
## Ladebooster
${calculations.booster?.needed ? `- Ladestrom: ${customBoosterCurrent ?? calculations.booster.currentA} A
- Spannung: ${calculations.booster.inputVoltage}V (Input) -> ${calculations.booster.outputVoltage}V (Output)` : '- Nicht benötigt'}

## Wechselrichter
${calculations.inverter?.needed ? `- Dauerleistung: ${customInverterPower ?? calculations.inverter.recommendedW} W` : '- Nicht benötigt'}

## Ladegerät (Landstrom)
${calculations.charger?.needed ? `- Ladestrom: ${customChargerCurrent ?? calculations.charger.recommendedCurrentA} A` : '- Nicht benötigt'}

## Solar-Laderegler (Dach)
${calculations.solarController?.needed ? `- Für Dach-Solarmodule
- Ladestrom: ${customSolarControllerCurrent ?? calculations.solarController.recommendedCurrentA} A` : '- Nicht benötigt'}
${portableSolarController ? `
## Solar-Laderegler (Solartaschen) - SEPARATES GERÄT
- Für mobile Solartaschen (${solarBags.map(b => `${b.power}Wp`).join(' + ')})
- Gesamtleistung: ${portableSolarController.totalWp} Wp
- Ladestrom: ${portableSolarController.recommendedCurrentA} A
- Hinweis: Separater Laderegler erforderlich, da Solartaschen unabhängig vom Dachsystem angeschlossen werden` : ''}
${calculations.cables && calculations.cables.length > 0 ? `
## Kabel
${calculations.cables.map(cable => `- ${cable.displayName}: ${cable.recommendedCrossSection} mm² (${cable.lengthM}m, ${cable.currentA.toFixed(1)}A)`).join('\n')}
` : ''}
                                    `.trim();
                                })()}
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div >
    );
}
