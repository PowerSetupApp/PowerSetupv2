"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface CategoryFilter {
    id: string;
    name: string;
    key: string;
    type: "text" | "number" | "select" | "multiselect" | "brand";
    unit: string | null;
    options: string[];
}

export interface Brand {
    id: string;
    name: string;
}

interface FilterFieldProps {
    filter: CategoryFilter;
    value: unknown;
    onChange: (value: unknown) => void;
    brands?: Brand[];
    onAddBrand?: (name: string) => Promise<Brand | null>;
}

export function FilterField({ filter, value, onChange, brands = [], onAddBrand }: FilterFieldProps) {
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState("");
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);

    const handleCreateBrand = async () => {
        if (!newBrandName.trim() || !onAddBrand) return;
        setIsCreatingBrand(true);
        try {
            const newBrand = await onAddBrand(newBrandName.trim());
            if (newBrand) {
                onChange(newBrand.id);
                setNewBrandName("");
                setIsAddingBrand(false);
            }
        } finally {
            setIsCreatingBrand(false);
        }
    };

    switch (filter.type) {
        case "text":
            return (
                <div className="space-y-2">
                    <Label>{filter.name}</Label>
                    <Input
                        value={(value as string) || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`${filter.name} eingeben...`}
                    />
                </div>
            );

        case "number":
            return (
                <div className="space-y-2">
                    <Label>
                        {filter.name}
                        {filter.unit && <span className="text-muted-foreground ml-1">({filter.unit})</span>}
                    </Label>
                    <Input
                        type="number"
                        value={(value as number) ?? ""}
                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder={`z.B. 100`}
                    />
                </div>
            );

        case "select":
            return (
                <div className="space-y-2">
                    <Label>
                        {filter.name}
                        {filter.unit && <span className="text-muted-foreground ml-1">({filter.unit})</span>}
                    </Label>
                    <select
                        value={(value as string) || ""}
                        onChange={(e) => onChange(e.target.value || null)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                        <option value="">Bitte wählen...</option>
                        {filter.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );

        case "multiselect":
            const selectedValues = Array.isArray(value) ? value : [];
            return (
                <div className="space-y-2">
                    <Label>
                        {filter.name}
                        {filter.unit && <span className="text-muted-foreground ml-1">({filter.unit})</span>}
                    </Label>
                    <div className="flex flex-wrap gap-3">
                        {filter.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(opt)}
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...selectedValues, opt]
                                            : selectedValues.filter((v: string) => v !== opt);
                                        onChange(newValues.length > 0 ? newValues : null);
                                    }}
                                    className="h-4 w-4"
                                />
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            );

        case "brand":
            return (
                <div className="space-y-2">
                    <Label>{filter.name}</Label>
                    {isAddingBrand ? (
                        <div className="flex gap-2">
                            <Input
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder="Markenname eingeben..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateBrand}
                                disabled={isCreatingBrand || !newBrandName.trim()}
                            >
                                {isCreatingBrand ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Anlegen"
                                )}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setIsAddingBrand(false);
                                    setNewBrandName("");
                                }}
                            >
                                Abbrechen
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                value={(value as string) || ""}
                                onChange={(e) => onChange(e.target.value || null)}
                                className="flex-1 px-3 py-2 border rounded-md bg-background"
                            >
                                <option value="">Keine Marke</option>
                                {brands.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {onAddBrand && (
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => setIsAddingBrand(true)}
                                    title="Neue Marke anlegen"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            );

        default:
            return null;
    }
}
