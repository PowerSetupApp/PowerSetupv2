"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useWizardStore } from "@/lib/store/wizard-store";
import { testAlgorithmCalculations } from "@/app/actions/test-algorithm";
import { type SystemRequirements } from "@/lib/requirements-engine";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Battery, Calculator, Check, Info, Settings2, Sun, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { InfoModal } from "@/components/ui/info-modal";

export function Step10Recommendation() {
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

        // Custom setters
        setCustomBatteryCapacity,
        setCustomSolarPower,
        setCustomBoosterCurrent,
        setCustomSolarControllerCurrent,

        // Current custom values
        customBatteryCapacity,
        customSolarPower,
        customBoosterCurrent,
        customSolarControllerCurrent
    } = useWizardStore();

    const [isLoading, setIsLoading] = useState(true);
    const [calculations, setCalculations] = useState<SystemRequirements | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Calculation
    useEffect(() => {
        const calculate = async () => {
            setIsLoading(true);
            try {
                // Construct formData from store (similar to page.tsx)
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
                };

                const result = await testAlgorithmCalculations(formData);
                if (result.success && result.data) {
                    setCalculations(result.data);

                    // Initialize custom values if not already set (or reset if drastically different? No, keep user edits)
                    // Actually, we probably only want to set them if they are null, to basically "seed" them with recommended values?
                    // No, users requested "adjust if needed". So inputs should show calculated value as placeholder or default, 
                    // and store override if user types.
                    // A better UX: Input defaults to calculated value.
                } else {
                    setError(result.error || "Fehler bei der Berechnung");
                }
            } catch (err) {
                console.error(err);
                setError("Berechnungsfehler");
            } finally {
                setIsLoading(false);
            }
        };

        if (!calculations) {
            calculate();
        }
    }, [calculations, vehicleType, systemVoltage, energySources, consumers]); // Dependencies to re-trigger? Maybe just once on mount.

    // Update store when inputs change
    const handleBatteryChange = (val: string) => {
        const num = val === "" ? null : parseInt(val);
        setCustomBatteryCapacity(num);
    };

    const handleSolarChange = (val: string) => {
        const num = val === "" ? null : parseInt(val);
        setCustomSolarPower(num);
    };

    const handleBoosterChange = (val: string) => {
        const num = val === "" ? null : parseInt(val);
        setCustomBoosterCurrent(num);
    };

    const handleControllerChange = (val: string) => {
        const num = val === "" ? null : parseInt(val);
        setCustomSolarControllerCurrent(num);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-1/3" />
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
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Technische Empfehlung</h2>
                    <Badge variant="outline" className="gap-1">
                        <Calculator className="h-3 w-3" />
                        KI-Berechnet
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Basierend auf deinen Angaben haben wir folgende Systemwerte berechnet.
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
                        <div className="space-y-3">
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
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="battery-override">Manuelle Kapazität (Ah)</Label>
                                <InfoModal title="Manuelle Anpassung" description="Hier kannst du eine eigene Batteriegröße festlegen. Wähle diesen Wert, wenn du bereits eine Batterie besitzt oder spezielle Anforderungen hast." />
                            </div>
                            <div className="relative">
                                <Input
                                    id="battery-override"
                                    type="number"
                                    placeholder={calculations.battery.recommendedCapacityAh.toString()}
                                    value={customBatteryCapacity ?? ""}
                                    onChange={(e) => handleBatteryChange(e.target.value)}
                                    className={customBatteryCapacity ? "border-amber-500 ring-amber-500/20" : ""}
                                />
                                {customBatteryCapacity && (
                                    <div className="absolute right-3 top-2.5 text-xs text-amber-500 font-medium flex items-center gap-1">
                                        <Settings2 className="h-3 w-3" />
                                        Manuell
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Lasse das Feld leer, um die Empfehlung ({calculations.battery.recommendedCapacityAh} Ah) zu nutzen.
                            </p>
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

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">Benötigt:</span>
                                    <InfoModal title="Benötigte Solarleistung" description="Die Menge an Solarleistung (Wp), die theoretisch nötig ist, um deinen Tagesbedarf im Durchschnitt vollständig durch Sonnenenergie zu decken." />
                                </div>
                                <div className="font-medium">{calculations.solarModules.requiredWp} Wp</div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-muted-foreground text-sm flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">Verfügbar (Dach+Tasche):</span>
                                    <InfoModal title="Verfügbare Leistung" description="Die maximal mögliche Solarleistung basierend auf deiner verfügbaren Dachfläche und gewählten Solartaschen." />
                                </div>
                                <div className="font-medium text-primary">{Math.ceil(calculations.solarModules.totalAvailableWp)} Wp</div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="solar-override">Manuelle Leistung (Wp)</Label>
                                <InfoModal title="Manuelle Anpassung" description="Lege fest, wie viel Watt Peak (Wp) an Solarleistung du tatsächlich installieren möchtest." />
                            </div>
                            <div className="relative">
                                <Input
                                    id="solar-override"
                                    type="number"
                                    placeholder={calculations.solarModules.totalAvailableWp.toString()}
                                    value={customSolarPower ?? ""}
                                    onChange={(e) => handleSolarChange(e.target.value)}
                                    className={customSolarPower ? "border-amber-500 ring-amber-500/20" : ""}
                                />
                                {customSolarPower && (
                                    <div className="absolute right-3 top-2.5 text-xs text-amber-500 font-medium flex items-center gap-1">
                                        <Settings2 className="h-3 w-3" />
                                        Manuell
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Definiert die gewünschte Gesamtleistung für die Produktauswahl.
                            </p>
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
                            <div className="space-y-3">
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
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="booster-override">Manueller Ladestrom (A)</Label>
                                    <InfoModal title="Manuelle Anpassung" description="Wähle eine andere Stärke für den Ladebooster, falls du spezifische Anforderungen hast." />
                                </div>
                                <div className="relative">
                                    <Input
                                        id="booster-override"
                                        type="number"
                                        placeholder={calculations.booster.currentA.toString()}
                                        value={customBoosterCurrent ?? ""}
                                        onChange={(e) => handleBoosterChange(e.target.value)}
                                        className={customBoosterCurrent ? "border-amber-500 ring-amber-500/20" : ""}
                                    />
                                    {customBoosterCurrent && (
                                        <div className="absolute right-3 top-2.5 text-xs text-amber-500 font-medium flex items-center gap-1">
                                            <Settings2 className="h-3 w-3" />
                                            Manuell
                                        </div>
                                    )}
                                </div>
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
                            <div className="space-y-3">
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
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="controller-override">Manueller Regler-Strom (A)</Label>
                                    <InfoModal title="Manuelle Anpassung" description="Wähle eine abweichende Ampere-Klasse für den Laderegler." />
                                </div>
                                <div className="relative">
                                    <Input
                                        id="controller-override"
                                        type="number"
                                        placeholder={calculations.solarController.recommendedCurrentA.toString()}
                                        value={customSolarControllerCurrent ?? ""}
                                        onChange={(e) => handleControllerChange(e.target.value)}
                                        className={customSolarControllerCurrent ? "border-amber-500 ring-amber-500/20" : ""}
                                    />
                                    {customSolarControllerCurrent && (
                                        <div className="absolute right-3 top-2.5 text-xs text-amber-500 font-medium flex items-center gap-1">
                                            <Settings2 className="h-3 w-3" />
                                            Manuell
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div >
    );
}
