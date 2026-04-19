"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Briefcase } from "lucide-react";

interface SolarBagSuggestionProps {
    requiredWp: number;
    availableWp: number;
    onAddBag?: (power: number) => void;
}

const bagPowerOptions = [100, 120, 140, 160, 180, 200, 220, 300, 400];

export function SolarBagSuggestion({ requiredWp, availableWp, onAddBag }: SolarBagSuggestionProps) {
    const [selectedPower, setSelectedPower] = useState<string>("");
    const [addedBags, setAddedBags] = useState<number[]>([]);

    const deficit = requiredWp - availableWp;
    const totalAddedPower = addedBags.reduce((sum, p) => sum + p, 0);
    const remainingDeficit = deficit - totalAddedPower;

    // Don't show if there's no deficit or Solar is not selected
    if (deficit <= 0 || requiredWp <= 0) return null;

    const handleAddBag = () => {
        const power = parseInt(selectedPower);
        if (!isNaN(power) && power > 0) {
            setAddedBags([...addedBags, power]);
            onAddBag?.(power);
            setSelectedPower("");
        }
    };

    const handleRemoveBag = (index: number) => {
        setAddedBags(addedBags.filter((_, i) => i !== index));
    };

    return (
        <Card className="p-6 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">Solarleistung ergänzen?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Deine Dachfläche liefert ca. <strong>{Math.ceil(availableWp)} Wp</strong>,
                            du benötigst aber ca. <strong>{Math.ceil(requiredWp)} Wp</strong>.
                            {remainingDeficit > 0 ? (
                                <> Mit einer mobilen Solartasche kannst du die fehlenden <strong>{Math.ceil(remainingDeficit)} Wp</strong> ergänzen.</>
                            ) : (
                                <span className="text-green-600 dark:text-green-400 font-medium"> ✓ Defizit ausgeglichen!</span>
                            )}
                        </p>
                    </div>

                    {/* Added bags list */}
                    {addedBags.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Hinzugefügte Solartaschen:</div>
                            <div className="flex flex-wrap gap-2">
                                {addedBags.map((power, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border shadow-sm"
                                    >
                                        <Briefcase className="h-4 w-4 text-yellow-600" />
                                        <span className="font-medium">{power} Wp</span>
                                        <button
                                            onClick={() => handleRemoveBag(index)}
                                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Gesamt: <strong>{totalAddedPower} Wp</strong> zusätzlich
                            </div>
                        </div>
                    )}

                    {/* Add bag form */}
                    {remainingDeficit > 0 && (
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <Select onValueChange={setSelectedPower} value={selectedPower}>
                                    <SelectTrigger className="bg-white dark:bg-gray-800">
                                        <SelectValue placeholder="Leistung wählen..." />
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
                            <Button onClick={handleAddBag} disabled={!selectedPower}>
                                <Plus className="h-4 w-4 mr-2" />
                                Hinzufügen
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
