
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Save, RotateCcw, Info, Settings2, Sun, Battery, Zap, Check, RefreshCw } from "lucide-react";
import { getAlgorithmSettings, updateAlgorithmSettings, syncComponentClassesFromDB, type AlgorithmSettingsData } from "@/app/actions/algorithm-settings";

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
        title: "Batterie-Sicherheitspuffer",
        description: "Multiplikator auf die berechnete Kapazität",
        tooltip: "Erhöht die Batterieempfehlung um diesen Faktor. Beispiel: Bei 1.5 wird eine berechnete 100Ah Batterie auf 150Ah aufgerundet. Nützlich bei vielen 230V Verbrauchern, um genug Strom für den Wechselrichter zu gewährleisten.",
        fields: [
            { key: "batterySafetyFactor", label: "Sicherheitsfaktor", type: "float", suffix: "x" },
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
            { key: "recommendedSolarYieldFactor", label: "Solar-Puffer (Empfehlung)", type: "float", suffix: "x" },
            { key: "solarSafetyFactor", label: "Regler-Sicherheitsfaktor", type: "float", suffix: "x" },
            { key: "roofUtilizationFactor", label: "Dach-Auslastung", type: "float", suffix: "x" },
            { key: "roofOrientationFactor", label: "Dach-Orientierung (Fest)", type: "float", suffix: "x" },
            { key: "portableOrientationFactor", label: "Taschen-Orientierung", type: "float", suffix: "x" },
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
        title: "Landstrom-Ladezeit",
        description: "Ziel-Ladezeit für 0-100% je nach Nutzer-Präferenz",
        tooltip: "Bestimmt, wie das Ladegerät dimensioniert wird: Batteriekapazität / Zielzeit = Ladestrom. Ein schnelleres Laden erfordert ein stärkeres Ladegerät.",
        fields: [
            { key: "chargerTimeHoursSlow", label: "Langsam", type: "float", suffix: "h" },
            { key: "chargerTimeHoursNormal", label: "Normal", type: "float", suffix: "h" },
            { key: "chargerTimeHoursFast", label: "Schnell", type: "float", suffix: "h" },
        ]
    },
    {
        title: "Komponentenklassen",
        description: "Verfügbare Größen (kommasepariert)",
        fields: [
            { key: "inverterClasses", label: "Wechselrichter (W)", type: "string" },
            { key: "chargerClasses", label: "Batterieladegeräte (A)", type: "string" },
            { key: "solarControllerClasses", label: "Solar-Laderegler (A)", type: "string" },
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
    {
        title: "Produkt-Vorauswahl (KI)",
        description: "Steuert, welche Produkte an die KI zur Auswahl weitergegeben werden",
        tooltip: "Produkte werden vorab nach technischer Eignung bewertet (0-100 Match-Score). Nur Produkte über der Schwelle werden der KI zur Auswahl angeboten. Niedrigere Werte = mehr Auswahl für die KI, höhere Werte = genauere Vorfilterung.",
        fields: [
            { key: "minPreselectionScore", label: "Min. Match-Score", type: "int", suffix: "/ 100" },
        ]
    },
];

export function AlgorithmSettings() {
    const [settings, setSettings] = useState<AlgorithmSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
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

    const handleSyncClasses = async () => {
        if (!settings) return;
        setSyncing(true);
        try {
            const result = await syncComponentClassesFromDB();
            if (result.success && result.data) {
                setSettings({ ...settings, ...result.data });
                setHasChanges(true);
            } else {
                alert("Fehler beim Synchronisieren: " + result.error);
            }
        } catch (error) {
            console.error("Failed to sync:", error);
            alert("Fehler beim Synchronisieren");
        } finally {
            setSyncing(false);
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
                            <div className="flex items-center justify-between">
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
                                {group.title === "Komponentenklassen" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSyncClasses}
                                        disabled={syncing || saving}
                                        className="h-8"
                                    >
                                        <RefreshCw className={`h-3 w-3 mr-2 ${syncing ? "animate-spin" : ""}`} />
                                        DB-Sync
                                    </Button>
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
                                            id={`setting-${field.key}`}
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
                                            className="h-9 transition-all duration-500"
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
            <SettingsSummary settings={settings} onHighlightClick={scrollToField} />
        </div>
    );

    function scrollToField(key: string) {
        const element = document.getElementById(`setting-${key}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2");
            setTimeout(() => {
                element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 2000);
        }
    }
}

function SettingsSummary({ settings, onHighlightClick }: { settings: AlgorithmSettingsData, onHighlightClick: (key: string) => void }) {
    const H = ({ k, children }: { k: keyof AlgorithmSettingsData, children: React.ReactNode }) => (
        <Highlight targetKey={k} onClick={onHighlightClick}>{children}</Highlight>
    );

    return (
        <Card className="bg-muted/50 border-blue-200 dark:border-blue-900 mb-20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>🤖</span>
                    <span>Algorithm-Check</span>
                </CardTitle>
                <CardDescription>
                    So würde der Algorithmus aktuell mit diesen Werten rechnen (Klicke auf Werte zum Bearbeiten):
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-base leading-relaxed">
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Settings2 className="h-4 w-4" /> Dimensionierung & Puffer</h4>
                    <p>
                        "Bei der <strong>Batterieberechnung</strong> unterscheiden wir zwischen Typen: Aus einer <strong>LiFePO4-Batterie</strong> entnehmen wir bis zu <H k="dodLifepo4">{settings.dodLifepo4 * 100}%</H>, während wir bei <strong>AGM</strong> nur <H k="dodAgm">{settings.dodAgm * 100}%</H> und bei <strong>Gel</strong> <H k="dodGel">{settings.dodGel * 100}%</H> der Nennkapazität einplanen, um die Lebensdauer zu schützen."
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Sun className="h-4 w-4" /> Solar-Ertrag</h4>
                    <p>
                        "Für die Solarberechnung nehmen wir an, dass ein Panel im Sommer durchschnittlich <H k="sunHoursSummer">{settings.sunHoursSummer}h</H> volle Leistung bringt.
                        Im Winter sind es nur <H k="sunHoursWinter">{settings.sunHoursWinter}h</H>.
                        Diese Werte werden je nach Reiseziel angepasst: In Skandinavien rechnen wir im Winter z.B. nur mit dem <H k="locationScandinavia">{settings.locationScandinavia}x</H>-fachen dieser Stunden."
                    </p>
                    <p className="mt-2">
                        "Die Modulleistung selbst kalkulieren wir mit <H k="wpPerM2Rigid">{settings.wpPerM2Rigid} Wp/m²</H> für starre und <H k="wpPerM2Flexible">{settings.wpPerM2Flexible} Wp/m²</H> für flexible Module.
                        An bewölkten Tagen rechnen wir pauschal mit <H k="cloudyYieldFactor">{(settings.cloudyYieldFactor * 100).toFixed(0)}%</H> des normalen Ertrags (Worst-Case).
                        Für die Empfehlung sind wir etwas optimistischer, trauen dem <strong>Solarertrag</strong> aber auch nur zu <H k="recommendedSolarYieldFactor">{settings.recommendedSolarYieldFactor * 100}%</H> (Sicherheitspuffer)."
                    </p>
                    <p className="mt-2">
                        "Zusätzlich berücksichtigen wir, dass man nie 100% der Dachfläche belegen kann (<H k="roofUtilizationFactor">{(settings.roofUtilizationFactor * 100).toFixed(0)}%</H> Auslastung).
                        Fest verbaute Module verlieren etwas Leistung durch schlechtere Ausrichtung (<H k="roofOrientationFactor">{settings.roofOrientationFactor}x</H>), während mobile Solartaschen oft optimal ausgerichtet werden können (<H k="portableOrientationFactor">{settings.portableOrientationFactor}x</H>)."
                    </p>
                    <p className="mt-2">
                        "Der <strong>Solar-Laderegler</strong> wird mit einem Sicherheitsfaktor von <H k="solarSafetyFactor">{settings.solarSafetyFactor || 1.1}x</H> (also +{(((settings.solarSafetyFactor || 1.1) - 1) * 100).toFixed(0)}%) berechnet, um Spannungsspitzen an kalten Tagen sicher abzufangen."
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Battery className="h-4 w-4" /> Autarkie & Standzeit</h4>
                    <p>
                        "Wenn ein Nutzer 'Kurz' steht, rechnen wir mit <H k="standingDaysShort">{settings.standingDaysShort} Tagen</H> ohne Fahren.
                        Auch wenn jemand 4 Wochen autark sein will, deckeln wir die reine Batterie-Reserve (ohne Solar/LiMa) auf maximal <H k="maxBackupDays">{settings.maxBackupDays} Tage</H>, um unrealistisch große Batterien zu vermeiden. Der Rest muss über Solar/Ladebooster kommen."
                    </p>
                    <p className="mt-2">
                        "Außerdem multiplizieren wir die berechnete Kapazität mit dem <H k="batterySafetyFactor">{settings.batterySafetyFactor}x</H> Sicherheitsfaktor, um genug Reserve für hohe Spitzenlasten (z.B. Wechselrichter) sicherzustellen."
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Technik: Booster & Wechselrichter</h4>
                    <p>
                        "Der <strong>Ladebooster</strong> wird basierend auf der <strong>Lichtmaschine</strong> gewählt: Bei einer Standard-LiMa empfehlen wir <H k="alternatorStandard">{settings.alternatorStandard}A</H>, bei verstärkten Modellen bis zu <H k="alternatorEnhanced">{settings.alternatorEnhanced}A</H>.
                        Ein <strong>Wechselrichter</strong> wird dimensioniert nach der Summe aller 230V-Geräte multipliziert mit dem Faktor <H k="simultaneousModerate">{settings.simultaneousModerate}</H> (bei moderater Nutzung), aber mindestens so stark wie das größte Einzelgerät."
                    </p>
                    <p className="mt-2">
                        "Für das <strong>Landstrom-Ladegerät</strong>: Bei der Einstellung 'Langsam' planen wir <H k="chargerTimeHoursSlow">{settings.chargerTimeHoursSlow}h</H> Ladezeit,
                        bei 'Normal' <H k="chargerTimeHoursNormal">{settings.chargerTimeHoursNormal}h</H> und bei 'Schnell' nur <H k="chargerTimeHoursFast">{settings.chargerTimeHoursFast}h</H>.
                        Die Formel: Batteriekapazität ÷ Zielzeit = benötigter Ladestrom."
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Check className="h-4 w-4" /> Kabel & Sicherheiten</h4>
                    <p>
                        "Kabel berechnen wir so, dass an kritischen Stellen (Inverter) maximal <H k="voltageDropCritical">{settings.voltageDropCritical}%</H> Spannung verloren geht.
                        Als spezifischen Widerstand für Kupfer nutzen wir <H k="copperResistivity">{settings.copperResistivity}</H>."
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function Highlight({ children, targetKey, onClick }: { children: React.ReactNode, targetKey: string, onClick: (key: string) => void }) {
    return (
        <span
            onClick={() => onClick(targetKey)}
            className="cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
            title="Klicken zum Bearbeiten"
        >
            {children}
        </span>
    );
}
