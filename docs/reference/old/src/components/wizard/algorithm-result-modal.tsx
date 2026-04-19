"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SystemRequirements } from "@/lib/algorithm";
import { Check, X, AlertTriangle, Battery, Zap, Sun, Cable, Plug } from "lucide-react";

interface AlgorithmResultModalProps {
    open: boolean;
    onClose: () => void;
    onContinue: () => void;
    data: SystemRequirements | null;
    isLoading?: boolean;
    error?: string | null;
}

export function AlgorithmResultModal({
    open,
    onClose,
    onContinue,
    data,
    isLoading,
    error,
}: AlgorithmResultModalProps) {
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Algorithmus-Testausgabe
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            <span className="ml-3 text-muted-foreground">Berechne...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
                            <div className="flex items-center gap-2 font-medium">
                                <X className="h-5 w-5" />
                                Fehler bei der Berechnung
                            </div>
                            <p className="mt-2 text-sm">{error}</p>
                        </div>
                    )}

                    {data && !isLoading && !error && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <span className="text-sm text-muted-foreground">Systemspannung</span>
                                    <p className="font-bold text-lg">{data.systemVoltage}V</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Tagesverbrauch</span>
                                    <p className="font-bold text-lg">{data.dailyWh} Wh/Tag</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Batterietyp</span>
                                    <p className="font-bold text-lg">{data.batteryType.toUpperCase()}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Komfortstufe</span>
                                    <p className="font-bold text-lg capitalize">{data.comfortLevel}</p>
                                </div>
                            </div>

                            {/* Battery */}
                            <Section icon={<Battery className="h-5 w-5" />} title="Batterie">
                                {data.battery.hasSolar && (
                                    <>
                                        <Row label="Täglicher Solarertrag" value={`${data.battery.dailySolarYieldWh} Wh`} />
                                        <Row label="Netto-Tagesdefizit" value={`${data.battery.netDailyDeficitWh} Wh`} />
                                    </>
                                )}
                                <Row label="Min. Kapazität (ohne Solar)" value={`${data.battery.minCapacityAh} Ah`} />
                                <Row
                                    label="Empfohlene Kapazität (mit Solar)"
                                    value={`${data.battery.recommendedCapacityAh} Ah`}
                                    highlight
                                />
                                <Row label="Max. Kapazität (Platz)" value={`${data.battery.maxCapacityAh} Ah`} />
                                <Row label="Autarkie-Tage" value={`${data.battery.autarchyDays} Tage`} />
                            </Section>

                            {/* Inverter */}
                            {data.inverter && (
                                <Section icon={<Plug className="h-5 w-5" />} title="Wechselrichter">
                                    <Row label="Benötigt" value={data.inverter.needed ? "Ja" : "Nein"} />
                                    <Row label="Berechnete Leistung" value={`${data.inverter.requiredW} W`} />
                                    <Row label="Empfohlene Klasse" value={`${data.inverter.recommendedW} W`} highlight />
                                    <Row label="Max. Einzellast" value={`${data.inverter.maxSingleLoadW} W`} />
                                    <Row label="Gleichzeitigkeitsfaktor" value={`${(data.inverter.simultaneousFactor * 100).toFixed(0)}%`} />
                                </Section>
                            )}

                            {/* Booster */}
                            {data.booster && (
                                <Section icon={<Zap className="h-5 w-5" />} title="Ladebooster (B2B)">
                                    <Row label="Ladestrom" value={`${data.booster.currentA} A`} highlight />
                                    <Row label="Eingang" value={`${data.booster.inputVoltage}V`} />
                                    <Row label="Ausgang" value={`${data.booster.outputVoltage}V`} />
                                    <Row
                                        label="Spannungswandlung"
                                        value={data.booster.needsConversion ? "Ja (12V→24V o.ä.)" : "Nein"}
                                        warning={data.booster.needsConversion}
                                    />
                                </Section>
                            )}

                            {/* Charger */}
                            {data.charger && (
                                <Section icon={<Plug className="h-5 w-5" />} title="Landstrom-Ladegerät">
                                    <Row label="Ziel-Ladestrom" value={`${data.charger.targetCurrentA} A`} />
                                    <Row label="Empfohlene Klasse" value={`${data.charger.recommendedCurrentA} A`} highlight />
                                    <Row label="Ladezeit" value={`~${data.charger.chargingTimeHours}h`} />
                                </Section>
                            )}

                            {/* Solar Controller */}
                            {data.solarController && (
                                <Section icon={<Sun className="h-5 w-5" />} title="Solar-Laderegler">
                                    <Row label="Gesamt-Wp" value={`${data.solarController.totalWp} Wp`} />
                                    <Row label="Dach-Wp" value={`${data.solarController.roofWp} Wp`} />
                                    <Row label="Portable Wp" value={`${data.solarController.portableWp} Wp`} />
                                    <Row label="Berechneter Strom" value={`${data.solarController.currentA} A`} />
                                    <Row label="Empfohlene Klasse" value={`${data.solarController.recommendedCurrentA} A`} highlight />
                                    <Row label="Typ" value={data.solarController.type} highlight />
                                    {data.solarController.needsSeparatePortableController && (
                                        <Row
                                            label="Separater Regler für Taschen"
                                            value="Ja (Mixed Setup)"
                                            warning
                                        />
                                    )}
                                </Section>
                            )}

                            {/* Solar Modules */}
                            {data.solarModules && (
                                <Section icon={<Sun className="h-5 w-5" />} title="Solarmodule">
                                    <Row label="Sonnenstunden/Tag" value={`${data.solarModules.sunHoursPerDay}h`} />
                                    <Row label="Benötigte Leistung" value={`${data.solarModules.requiredWp} Wp`} highlight />
                                    <Row label="Max. Dach-Wp" value={`${data.solarModules.maxRoofWp} Wp`} />
                                    <Row label="Portable Wp" value={`${data.solarModules.portableWp} Wp`} />
                                    <Row label="Gesamt verfügbar" value={`${data.solarModules.totalAvailableWp} Wp`} />
                                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                                        {data.solarModules.recommendation}
                                    </div>
                                </Section>
                            )}

                            {/* Cables */}
                            {data.cables && data.cables.length > 0 && (
                                <Section icon={<Cable className="h-5 w-5" />} title="Kabel">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">Route</th>
                                                    <th className="text-right py-2">Länge</th>
                                                    <th className="text-right py-2">Strom</th>
                                                    <th className="text-right py-2">Min. mm²</th>
                                                    <th className="text-right py-2 font-bold text-primary">Empfohlen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.cables.map((cable, idx) => (
                                                    <tr key={idx} className="border-b border-muted">
                                                        <td className="py-2">{cable.displayName}</td>
                                                        <td className="text-right">{cable.lengthM}m</td>
                                                        <td className="text-right">{cable.currentA}A</td>
                                                        <td className="text-right">{cable.minCrossSection}</td>
                                                        <td className="text-right font-bold text-primary">{cable.recommendedCrossSection} mm²</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Section>
                            )}

                            {/* Timestamp */}
                            <div className="text-xs text-muted-foreground text-center pt-4">
                                Berechnet: {new Date(data.calculatedAt).toLocaleString('de-DE')}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Schließen
                    </Button>
                    <Button onClick={onContinue} disabled={!data || isLoading}>
                        <Check className="h-4 w-4 mr-2" />
                        Weiter zur Produktauswahl
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper Components
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 font-medium">
                {icon}
                {title}
            </div>
            <div className="p-4 space-y-2">
                {children}
            </div>
        </div>
    );
}

function Row({
    label,
    value,
    highlight,
    warning
}: {
    label: string;
    value: string | React.ReactNode;
    highlight?: boolean;
    warning?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${highlight ? 'text-primary font-bold' : ''} ${warning ? 'text-yellow-600 dark:text-yellow-400 flex items-center gap-1' : ''}`}>
                {warning && <AlertTriangle className="h-4 w-4" />}
                {value}
            </span>
        </div>
    );
}
