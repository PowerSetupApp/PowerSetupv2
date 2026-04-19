"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Battery, Sun, Zap, Settings2, Cable } from "lucide-react";

interface DebugCalculationsProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    calculations: any; // SystemRequirements
    userConfig: any;
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={`font-medium ${highlight ? 'text-primary font-bold' : ''}`}>{value}</span>
        </div>
    );
}

export function ResultDebugCalculations({ isOpen, onOpenChange, calculations, userConfig }: DebugCalculationsProps) {
    if (!calculations) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Debug: Berechnungsdetails
                    </DialogTitle>
                    <DialogDescription>
                        Detaillierte Aufschlüsselung aller Berechnungen und Parameter.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="battery" className="mt-4">
                    <TabsList className="grid grid-cols-5 w-full">
                        <TabsTrigger value="battery">Batterie</TabsTrigger>
                        <TabsTrigger value="solar">Solar</TabsTrigger>
                        <TabsTrigger value="charging">Laden</TabsTrigger>
                        <TabsTrigger value="inverter">Wechselrichter</TabsTrigger>
                        <TabsTrigger value="raw">Raw Data</TabsTrigger>
                    </TabsList>

                    {/* Battery Tab */}
                    <TabsContent value="battery" className="space-y-4 mt-4">
                        <Card className="p-4 space-y-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Battery className="h-5 w-5 text-green-500" />
                                Batterieberechnung
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <InfoRow label="Systemspannung" value={`${calculations.systemVoltage}V`} />
                                <InfoRow label="Batterietyp" value={calculations.batteryType?.toUpperCase() || '-'} />
                                <InfoRow label="Tagesverbrauch" value={`${calculations.dailyWh} Wh`} />
                                <InfoRow label="Tagesverbrauch (Ah)" value={`${Math.round(calculations.dailyWh / calculations.systemVoltage)} Ah`} />
                                <Separator className="my-2" />
                                {calculations.battery && (
                                    <>
                                        <InfoRow label="Solar-Ertrag/Tag" value={`${calculations.battery.dailySolarYieldWh || 0} Wh`} />
                                        <InfoRow label="Netto-Defizit/Tag" value={`${calculations.battery.netDailyDeficitWh || 0} Wh`} />
                                        <InfoRow label="Autarkie-Tage" value={`${calculations.battery.autarchyDays || 0} Tage`} />
                                        <Separator className="my-2" />
                                        <InfoRow label="Min. Kapazität (Schlechtwetter)" value={`${calculations.battery.minCapacityAh} Ah`} />
                                        <InfoRow label="Empfohlene Kapazität" value={`${calculations.battery.recommendedCapacityAh} Ah`} highlight />
                                        <InfoRow label="Max. Kapazität (Obergrenze)" value={`${calculations.battery.maxCapacityAh || '-'} Ah`} />
                                    </>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Solar Tab */}
                    <TabsContent value="solar" className="space-y-4 mt-4">
                        {calculations.solarModules ? (
                            <>
                                <Card className="p-4 space-y-3">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Sun className="h-5 w-5 text-yellow-500" />
                                        Solarmodule
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <InfoRow label="Tagesverbrauch" value={`${calculations.solarModules.dailyWh} Wh`} />
                                        <InfoRow label="Sonnenstunden/Tag" value={`${calculations.solarModules.sunHoursPerDay} h`} />
                                        <InfoRow label="Benötigte Leistung" value={`${calculations.solarModules.requiredWp} Wp`} highlight />
                                        <Separator className="my-2" />
                                        <InfoRow label="Max. Dachfläche" value={`${calculations.solarModules.maxRoofWp} Wp`} />
                                        <InfoRow label="Portable (Taschen)" value={`${calculations.solarModules.portableWp} Wp`} />
                                        <InfoRow label="Gesamt verfügbar" value={`${Math.ceil(calculations.solarModules.totalAvailableWp)} Wp`} highlight />
                                        <Separator className="my-2" />
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Empfehlung: </span>
                                            <span className="font-medium">{calculations.solarModules.recommendation || '-'}</span>
                                        </div>
                                    </div>
                                </Card>

                                {calculations.solarController && (
                                    <Card className="p-4 space-y-3">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Settings2 className="h-5 w-5 text-orange-500" />
                                            Solar-Laderegler
                                            <Badge variant="secondary">{calculations.solarController.type}</Badge>
                                        </div>
                                        <Separator />
                                        <div className="space-y-1">
                                            <InfoRow label="PV-Leistung" value={`${calculations.solarController.totalWp} Wp`} />
                                            <InfoRow label="Strom (berechnet)" value={`${calculations.solarController.currentA?.toFixed(1) || '-'} A`} />
                                            <InfoRow label="Empfohlene Klasse" value={`${calculations.solarController.recommendedCurrentA} A`} highlight />
                                        </div>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card className="p-6 text-center text-muted-foreground">
                                <Sun className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Solar wurde nicht als Energiequelle gewählt.</p>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Charging Tab */}
                    <TabsContent value="charging" className="space-y-4 mt-4">
                        {calculations.booster && (
                            <Card className="p-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Zap className="h-5 w-5 text-blue-500" />
                                    Ladebooster (B2B)
                                    <Badge variant="outline">{calculations.booster.inputVoltage}V → {calculations.booster.outputVoltage}V</Badge>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <InfoRow label="Lichtmaschine" value={calculations.booster.alternatorType?.replace('_', ' ') || '-'} />
                                    <InfoRow label="Spannungswandlung" value={calculations.booster.needsConversion ? 'Ja' : 'Nein'} />
                                    <InfoRow label="Empfohlener Strom" value={`${calculations.booster.currentA} A`} highlight />
                                </div>
                            </Card>
                        )}

                        {calculations.charger && (
                            <Card className="p-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                    Batterieladegerät (230V)
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <InfoRow label="Ziel-Ladestrom" value={`${calculations.charger.targetCurrentA} A`} />
                                    <InfoRow label="Ladezeit (0-100%)" value={`${calculations.charger.chargingTimeHours} Std.`} />
                                    <InfoRow label="Empfohlener Strom" value={`${calculations.charger.recommendedCurrentA} A`} highlight />
                                </div>
                            </Card>
                        )}

                        {!calculations.booster && !calculations.charger && (
                            <Card className="p-6 text-center text-muted-foreground">
                                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Keine Ladequellen (Lichtmaschine/Landstrom) gewählt.</p>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Inverter Tab */}
                    <TabsContent value="inverter" className="space-y-4 mt-4">
                        {calculations.inverter ? (
                            <Card className="p-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Zap className="h-5 w-5 text-red-500" />
                                    Wechselrichter
                                    <Badge variant="outline">Reiner Sinus</Badge>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <InfoRow label="Gesamt 230V Last" value={`${calculations.inverter.total230VLoadW} W`} />
                                    <InfoRow label="Max. Einzelgerät" value={`${calculations.inverter.maxSingleLoadW} W`} />
                                    <InfoRow label="Gleichzeitigkeitsfaktor" value={`${calculations.inverter.simultaneousFactor}`} />
                                    <InfoRow label="Berechnete Last" value={`${calculations.inverter.requiredW} W`} />
                                    <Separator className="my-2" />
                                    <InfoRow label="Empfohlene Leistung" value={`${calculations.inverter.recommendedW} W`} highlight />
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 text-center text-muted-foreground">
                                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Keine 230V Verbraucher gewählt - kein Wechselrichter nötig.</p>
                            </Card>
                        )}

                        {/* Cables */}
                        {calculations.cables && calculations.cables.length > 0 && (
                            <Card className="p-4 space-y-3">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Cable className="h-5 w-5 text-gray-500" />
                                    Kabelquerschnitte
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    {calculations.cables.map((cable: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className={`${cable.isCritical ? 'font-medium' : 'text-muted-foreground'}`}>
                                                {cable.displayName || cable.route}
                                            </span>
                                            <span className="font-mono">
                                                {cable.recommendedCrossSection} mm² ({cable.currentA}A, {cable.lengthM}m)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Raw Data Tab */}
                    <TabsContent value="raw" className="mt-4">
                        <div className="space-y-4">
                            <Card className="p-4">
                                <h4 className="font-semibold mb-2">User Config</h4>
                                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-48">
                                    {JSON.stringify(userConfig, null, 2)}
                                </pre>
                            </Card>
                            <Card className="p-4">
                                <h4 className="font-semibold mb-2">Calculations</h4>
                                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-96">
                                    {JSON.stringify(calculations, null, 2)}
                                </pre>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
