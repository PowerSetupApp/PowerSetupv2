
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Save, RotateCcw, Info } from "lucide-react";
import { getAlgorithmSettings, updateAlgorithmSettings, type AlgorithmSettingsData } from "@/app/actions/algorithm-settings";

interface SettingsGroup {
    title: string;
    description: string;
    tooltip?: string;
    fields: {
        key: keyof Omit<AlgorithmSettingsData, "id">;
        label: string;
        type: "float" | "int" | "string";
        suffix?: string;
    }[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
    {
        title: "Entladetiefe (DoD)",
        description: "Depth of Discharge pro Batterietyp",
        fields: [
            { key: "dodLifepo4", label: "LiFePO4", type: "float", suffix: "%" },
            { key: "dodAgm", label: "AGM", type: "float", suffix: "%" },
            { key: "dodGel", label: "Gel", type: "float", suffix: "%" },
        ]
    },
    {
        title: "Gleichzeitigkeitsfaktor",
        description: "Wie viele Geräte gleichzeitig laufen",
        tooltip: "Der Algorithmus wählt IMMER das Maximum aus: Entweder (Gesamtlast * Faktor) ODER (Stärkster Einzelverbraucher). Zusätzlich werden 10% Sicherheitspuffer addiert.",
        fields: [
            { key: "simultaneousLow", label: "Wenig", type: "float" },
            { key: "simultaneousModerate", label: "Moderat", type: "float" },
            { key: "simultaneousHigh", label: "Viele", type: "float" },
        ]
    },
    {
        title: "Ladebooster-Strom",
        description: "Empfohlener B2B-Strom pro Lichtmaschinen-Typ",
        fields: [
            { key: "alternatorStandard", label: "Standard (90-120A)", type: "int", suffix: "A" },
            { key: "alternatorEnhanced", label: "Verstärkt (150-180A)", type: "int", suffix: "A" },
            { key: "alternatorEuro6dSmart", label: "Euro 6d / Smart", type: "int", suffix: "A" },
            { key: "alternatorUnknown", label: "Unbekannt", type: "int", suffix: "A" },
        ]
    },
    {
        title: "Batterie-Platz",
        description: "Maximale Batteriekapazität pro Raumgröße",
        fields: [
            { key: "batteryCompact", label: "Kompakt", type: "int", suffix: "Ah" },
            { key: "batteryMedium", label: "Mittel", type: "int", suffix: "Ah" },
            { key: "batterySpacious", label: "Groß", type: "int", suffix: "Ah" },
        ]
    },
    {
        title: "Standzeit-Definitionen",
        description: "Definiert, wie viele Tage 'Kurz', 'Mittel' und 'Lang' bedeuten",
        fields: [
            { key: "standingDaysShort", label: "Kurz", type: "int", suffix: "Tage" },
            { key: "standingDaysMedium", label: "Mittel", type: "int", suffix: "Tage" },
            { key: "standingDaysLong", label: "Lang", type: "int", suffix: "Tage" },
        ]
    },
    {
        title: "Max. Backup-Puffer",
        description: "Maximale Autarkie-Dauer für die 'Min. Kapazität (ohne Solar)'. Verhindert unrealistisch hohe Batterie-Empfehlungen.",
        fields: [
            { key: "maxBackupDays", label: "Maximal-Limit", type: "int", suffix: "Tage" },
        ]
    },
    {
        title: "Solar Wp pro m²",
        description: "Leistung pro Quadratmeter Dachfläche",
        fields: [
            { key: "wpPerM2Rigid", label: "Starr (Glas)", type: "int", suffix: "Wp" },
            { key: "wpPerM2Flexible", label: "Flexibel", type: "int", suffix: "Wp" },
            { key: "cloudyYieldFactor", label: "Bewölkt-Faktor", type: "float", suffix: "x" },
        ]
    },
    {
        title: "Sonnenstunden",
        description: "Durchschnittliche Sonnenstunden pro Tag (D-A-CH)",
        tooltip: "Basis-Werte für die Berechnung. Werden je nach Saison-Auswahl (Sommer/Ganzjährig/Winter) mit dem Standort-Faktor multipliziert.",
        fields: [
            { key: "sunHoursSummer", label: "Nur Sommer", type: "float", suffix: "h" },
            { key: "sunHoursAllYear", label: "Ganzjährig", type: "float", suffix: "h" },
            { key: "sunHoursWinter", label: "Winterfokus", type: "float", suffix: "h" },
        ]
    },
    {
        title: "Standort-Modifikatoren",
        description: "Sonnenstunden-Multiplikator nach Winterstandort",
        tooltip: "Multiplikator für die Winter-Sonnenstunden. Formel: Basis-Stunden * Modifier. Beispiel: 2h * 0.6 (Skandinavien) = 1.2h effektive Sonne.",
        fields: [
            { key: "locationGermanyAlps", label: "Deutschland/Alpen", type: "float" },
            { key: "locationSouthernEurope", label: "Südeuropa", type: "float" },
            { key: "locationScandinavia", label: "Skandinavien", type: "float" },
            { key: "locationVaries", label: "Variiert", type: "float" },
        ]
    },
    {
        title: "Kühlgeräte Duty Cycle",
        description: "Anteil der Zeit, die Kühlgeräte aktiv kühlen",
        fields: [
            { key: "dutyCycleCompressor", label: "Kompressor", type: "float" },
            { key: "dutyCycleAbsorber", label: "Absorber", type: "float" },
        ]
    },
    {
        title: "Komponentenklassen",
        description: "Verfügbare Größen (kommasepariert)",
        fields: [
            { key: "inverterClasses", label: "Wechselrichter (W)", type: "string" },
            { key: "chargerClasses", label: "Ladegeräte (A)", type: "string" },
            { key: "solarControllerClasses", label: "Solar-Regler (A)", type: "string" },
            { key: "cableSizes", label: "Kabelquerschnitte (mm²)", type: "string" },
        ]
    },
    {
        title: "Spannungsabfall",
        description: "Maximaler zulässiger Spannungsabfall",
        fields: [
            { key: "voltageDropCritical", label: "Kritisch (Inverter)", type: "float", suffix: "%" },
            { key: "voltageDropNormal", label: "Normal", type: "float", suffix: "%" },
            { key: "voltageDropSolar", label: "Solar", type: "float", suffix: "%" },
        ]
    },
    {
        title: "Kupfer-Widerstand",
        description: "Spezifischer Widerstand für Kabelberechnung",
        fields: [
            { key: "copperResistivity", label: "Ρ (Kupfer)", type: "float", suffix: "Ω·mm²/m" },
        ]
    },
];

export function AlgorithmSettings() {
    const [settings, setSettings] = useState<AlgorithmSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getAlgorithmSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: keyof Omit<AlgorithmSettingsData, "id">, value: string | number) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const { id, ...data } = settings;
            const result = await updateAlgorithmSettings(data);
            if (result.success) {
                setHasChanges(false);
            } else {
                alert("Fehler beim Speichern: " + result.error);
            }
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Fehler beim Speichern");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!settings) {
        return <div className="text-destructive">Einstellungen konnten nicht geladen werden.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Save Button - Sticky */}
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-background/95 backdrop-blur border rounded-lg">
                <div>
                    <h3 className="font-semibold">Berechnungsparameter</h3>
                    <p className="text-sm text-muted-foreground">
                        Diese Werte werden für die algorithmische Komponentenberechnung verwendet.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadSettings} disabled={saving}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Zurücksetzen
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Speichern
                    </Button>
                </div>
            </div>

            {/* Settings Groups */}
            <div className="grid gap-6 md:grid-cols-2">
                {SETTINGS_GROUPS.map((group) => (
                    <Card key={group.title}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{group.title}</CardTitle>
                                {group.tooltip && (
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help p-1 hover:bg-muted rounded-full transition-colors">
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[400px] bg-foreground text-background" side="top">
                                                <p>{group.tooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <CardDescription>{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {group.fields.map((field) => (
                                <div key={field.key} className="flex items-center gap-3">
                                    <Label className="w-1/2 text-sm">{field.label}</Label>
                                    <div className="flex-1 flex items-center gap-2">
                                        <Input
                                            type={field.type === "string" ? "text" : "number"}
                                            step={field.type === "float" ? "0.01" : "1"}
                                            value={settings[field.key] ?? ""}
                                            onChange={(e) => {
                                                const val = field.type === "string"
                                                    ? e.target.value
                                                    : field.type === "int"
                                                        ? parseInt(e.target.value) || 0
                                                        : parseFloat(e.target.value) || 0;
                                                handleChange(field.key, val);
                                            }}
                                            className="h-9"
                                        />
                                        {field.suffix && (
                                            <span className="text-sm text-muted-foreground w-12">{field.suffix}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Explanatory Summary */}
            <SettingsSummary settings={settings} />
        </div>
    );
}

function SettingsSummary({ settings }: { settings: AlgorithmSettingsData }) {
    return (
        <Card className="bg-muted/50 border-blue-200 dark:border-blue-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>🤖</span>
                    <span>Algorithm-Check</span>
                </CardTitle>
                <CardDescription>
                    So würde der Algorithmus aktuell mit diesen Werten rechnen:
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-base leading-relaxed">
                <p>
                    "Wenn wir einen Stromverbraucher berechnen, gehen wir davon aus, dass im Sommer <Highlight>{settings.sunHoursSummer}h</Highlight> und im Winter <Highlight>{settings.sunHoursWinter}h</Highlight> lang effektive Sonne scheint.
                    Dabei multiplizieren wir diese Basiswerte mit dem Winter-Standort-Faktor (z.B. Skandinavien = <Highlight>{settings.locationScandinavia}x</Highlight>, Südeuropa = <Highlight>{settings.locationSouthernEurope}x</Highlight>), falls relevant."
                </p>

                <p>
                    "Falls es mal komplett bewölkt ist, rechnen wir nicht mit 0 Ertrag, sondern immer noch mit <Highlight>{(settings.cloudyYieldFactor * 100).toFixed(0)}%</Highlight> der normalen saisonalen Leistung. Das verhindert, dass die Batterie übertrieben riesig dimensioniert wird."
                </p>

                <p>
                    "Wenn jemand sagt, er möchte <Highlight>20 Tage</Highlight> autark stehen, aber gleichzeitig angibt, dass er seine Location alle <Highlight>{settings.standingDaysShort} Tage</Highlight> (Kurz) wechselt, dann berechnen wir die Batterie auch nur für diese <Highlight>{settings.standingDaysShort} Tage</Highlight>, da er dann ja eh fährt und nachlädt."
                </p>

                <p>
                    "Für den absoluten Worst-Case (Winter, dunkel, Motor kaputt) dimensionieren wir die Minimum-Batterie so, dass sie maximal <Highlight>{settings.maxBackupDays} Tage</Highlight> komplett ohne Nachladung durchhält."
                </p>

                <p>
                    "Bei der <strong>Wechselrichter-Leistung</strong> prüfen wir beides: Summe aller Geräte mal <Highlight>{settings.simultaneousModerate} (Faktor)</Highlight> UND den stärksten Einzelverbraucher. Das Maximum gewinnt, plus <Highlight>10%</Highlight> Sicherheitspuffer. So knallt die Sicherung auch beim Föhnen (2000W) nicht durch!"
                </p>
            </CardContent>
        </Card>
    );
}

function Highlight({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
            {children}
        </span>
    );
}
