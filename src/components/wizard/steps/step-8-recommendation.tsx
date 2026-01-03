"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useWizardStore } from "@/lib/store/wizard-store";
import { testAlgorithmCalculations } from "@/app/actions/test-algorithm";
import { type SystemRequirements } from "@/lib/requirements-engine";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Battery, Calculator, Check, Info, RotateCcw, Settings2, Sun, Zap, Bug } from "lucide-react";
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
        alternatorSize,
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
        setCustomChargerCurrent
    } = useWizardStore();

    const [isLoading, setIsLoading] = useState(true);
    const [calculations, setCalculations] = useState<SystemRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    // Filter out functions and only keep data for debug view
    const debugData = {
        vehicleType,
        vehicleVoltage,
        systemVoltage,
        energySources,
        consumers: consumers.length, // Just count to avoid huge dump
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
        alternatorSize,
        batterySpaceSize,
        roofAreas,
        customOverrides: {
            battery: customBatteryCapacity,
            solar: customSolarPower,
            booster: customBoosterCurrent,
            controller: customSolarControllerCurrent,
            inverter: customInverterPower,
            charger: customChargerCurrent
        }
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
            alternatorSize,
            batterySpaceSize,
            roofAreas: roofAreas && roofAreas.length > 0 ? roofAreas : (solarDimensions ? [{ id: 'main', name: 'Hauptfläche', length: solarDimensions.length, width: solarDimensions.width }] : []),
            shoreChargingSpeed,
        };

        const payloadStr = JSON.stringify(formData);

        // Skip if payload hasn't changed and not forced
        if (!force && payloadStr === lastPayloadRef.current && calculations) {
            return;
        }

        lastPayloadRef.current = payloadStr;
        setIsLoading(true);

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
        }
    }, [
        vehicleType, vehicleVoltage, systemVoltage, energySources, consumers,
        autarchyGoal, autarchyDays, solarSetupType, solarDimensions,
        roofModuleType, solarModulePreference, solarBags, cableLengths,
        comfortLevel, schematicPreference, batteryPreference, travelBehavior,
        simultaneousLoad, alternatorSize, batterySpaceSize, roofAreas, shoreChargingSpeed,
        calculations // Added calculations to dependency to allow skipping if already exists
    ]);

    useEffect(() => {
        calculate();
        // Removed window.focus listener to prevent mobile keyboard loops
    }, [calculate]);

    // Sync Solar Controller with Custom Solar Power
    useEffect(() => {
        if (calculations && customSolarPower !== null) {
            const voltage = calculations.systemVoltage;
            // Get safety factor from settings (via debug info) or default to 1.1 (10%)
            const safetyFactor = calculations.debug?.solarSafetyFactor || 1.1;

            // Formula: Wp / Voltage * Safety Factor
            const calculatedAmps = (customSolarPower / voltage) * safetyFactor;

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
                        onClick={() => calculate()}
                        disabled={isLoading}
                        title="Neu berechnen"
                    >
                        <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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

            <div className="grid gap-6 md:grid-cols-2">
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
                                Solarleistung
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
                                                <span className="truncate">Benötigt:</span>
                                                <InfoModal title="Benötigte Solarleistung" description="Die Menge an Solarleistung (Wp), die theoretisch nötig ist, um deinen Tagesbedarf im Durchschnitt vollständig durch Sonnenenergie zu decken." />
                                            </div>
                                            <div className="font-medium">{calculations.solarModules.requiredWp} Wp</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">
                                                    {solarSetupType === 'roof' ? 'Verfügbar (Dach):' :
                                                        solarSetupType === 'portable' ? 'Verfügbar (Tasche):' :
                                                            'Verfügbar (Dach+Tasche):'}
                                                </span>
                                                <InfoModal title="Verfügbare Leistung" description="Die maximal mögliche Solarleistung basierend auf deiner verfügbaren Dachfläche und gewählten Solartaschen." />
                                            </div>
                                            <div className="font-medium text-primary">{Math.ceil(calculations.solarModules.totalAvailableWp)} Wp</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="solar-override">Geplante Leistung (Wp)</Label>
                                    <InfoModal title="Leistung anpassen" description="Lege fest, wie viel Watt Peak (Wp) an Solarleistung du tatsächlich installieren möchtest." />
                                </div>
                                <RecommendationAdjustmentInput
                                    id="solar-override"
                                    value={customSolarPower}
                                    recommendedValue={Math.min(Math.ceil(calculations.solarModules.requiredWp), Math.ceil(calculations.solarModules.totalAvailableWp))}
                                    onChange={setCustomSolarPower}
                                    unit="Wp"
                                />
                            </div>
                        </div>

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
                                    recommendedValue={calculations.booster.currentA}
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
                                            <div className="font-bold text-primary">{calculations.charger.recommendedCurrentA} A</div>
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
                                    recommendedValue={calculations.charger.recommendedCurrentA}
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
                                            <div className="font-bold text-primary">{calculations.inverter.recommendedW} W</div>
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
                                    recommendedValue={calculations.inverter.recommendedW}
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
                                Solar-Laderegler
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
                                                <span className="truncate">Max. Strom (Berechnet):</span>
                                                <InfoModal title="Maximaler Strom" description="Der theoretische maximale Strom, der von den Solarmodulen zur Batterie fließt. Der Regler muss diesen Strom verarbeiten können." />
                                            </div>
                                            <div className="font-medium">{calculations.solarController.currentA.toFixed(1)} A</div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                                <span className="truncate">Empfohlene Klasse:</span>
                                                <InfoModal title="Empfohlene Größe" description="Die nächsthöhere Standardgröße für den Solarladeregler, um sicheren Betrieb und Reserven zu gewährleisten." />
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
                                    recommendedValue={calculations.solarController.recommendedCurrentA}
                                    onChange={setCustomSolarControllerCurrent}
                                    unit="A"
                                />
                            </div>
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
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(debugData, null, 2)}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
