
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Smile } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

interface Category {
    id: string;
    name: string;
}

// Helper function to generate i18n key from name
function generateI18nKey(name: string): string {
    return name
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, ''); // Remove all whitespace
}

export default function NewConsumerDevicePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    // Default Values
    const [formData, setFormData] = useState({
        name: "",
        i18nKey: "",
        icon: "⚡",
        categoryId: "",

        defaultPower: "50",
        defaultVoltage: "user",
        defaultMinutesPerDay: "120",  // UI shows minutes, backend uses hours
        stepPercentage: "10",  // UI shows percentage, backend uses hours

        showHoursField: true,
        showFixedOption: true,
        isCooling: false,

        sortOrder: "0",
        isFeatured: false,
    });

    useEffect(() => {
        // Load categories for dropdown
        fetch("/api/admin/consumer-categories")
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Calculate step hours from percentage
            const durationMinutes = parseFloat(formData.defaultMinutesPerDay);
            const percentage = parseFloat(formData.stepPercentage);
            const stepMinutes = (durationMinutes * percentage) / 100;

            // Convert minutes to hours for backend
            const dataToSend = {
                ...formData,
                defaultHoursPerDay: (durationMinutes / 60).toString(),
                stepHours: (stepMinutes / 60).toString(),
            };
            const res = await fetch("/api/admin/consumer-devices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            if (!res.ok) throw new Error("Fehler beim Speichern");
            router.push("/admin/consumer-devices");
            router.refresh(); // Refresh server components
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/consumer-devices">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Neues Gerät</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basisdaten */}
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Basisdaten</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    setFormData({
                                        ...formData,
                                        name: newName,
                                        i18nKey: generateI18nKey(newName)
                                    });
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="i18nKey">i18n Key (Optional)</Label>
                            <Input
                                id="i18nKey"
                                value={formData.i18nKey}
                                onChange={(e) => setFormData({ ...formData, i18nKey: e.target.value })}
                                placeholder="z.B. fridge"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Kategorie *</Label>
                            <select
                                id="categoryId"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border bg-background"
                                required
                            >
                                <option value="">Bitte wählen...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <div className="flex gap-2">
                                <div className="h-10 w-10 flex items-center justify-center text-xl border rounded-md bg-background">
                                    {formData.icon}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEmojiModalOpen(true)}
                                >
                                    <Smile className="h-4 w-4 mr-2" />
                                    Wählen
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Standardwerte */}
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Standardwerte</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultPower">Leistung (Watt) *</Label>
                            <Input
                                id="defaultPower"
                                type="number"
                                value={formData.defaultPower}
                                onChange={(e) => setFormData({ ...formData, defaultPower: e.target.value })}
                                required
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultVoltage">Spannung *</Label>
                            <select
                                id="defaultVoltage"
                                value={formData.defaultVoltage}
                                onChange={(e) => setFormData({ ...formData, defaultVoltage: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border bg-background"
                            >
                                <option value="user">Benutzerauswahl (System)</option>
                                <option value="230V">230V</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultMinutesPerDay">Nutzungsdauer (Min/Tag) *</Label>
                            <Input
                                id="defaultMinutesPerDay"
                                type="number"
                                value={formData.defaultMinutesPerDay}
                                onChange={(e) => setFormData({ ...formData, defaultMinutesPerDay: e.target.value })}
                                required
                                step="1"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stepPercentage">Schrittweite (%)</Label>
                            <div className="relative">
                                <Input
                                    id="stepPercentage"
                                    type="number"
                                    value={formData.stepPercentage}
                                    onChange={(e) => setFormData({ ...formData, stepPercentage: e.target.value })}
                                    step="1"
                                    min="1"
                                    max="100"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    ≈ {Math.round((parseFloat(formData.defaultMinutesPerDay || "0") * parseFloat(formData.stepPercentage || "0")) / 100)} Min.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optionen */}
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="text-lg font-semibold border-b pb-2">Konfiguration & UI</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Featured (Sektion)</Label>
                                <p className="text-sm text-muted-foreground">Direkt in der Kategorie-Sektion anzeigen</p>
                            </div>
                            <Switch
                                checked={formData.isFeatured}
                                onCheckedChange={(c) => setFormData({ ...formData, isFeatured: c })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Stunden-Feld anzeigen</Label>
                                <p className="text-sm text-muted-foreground">Soll der User die Stunden anpassen können?</p>
                            </div>
                            <Switch
                                checked={formData.showHoursField}
                                onCheckedChange={(c) => setFormData({ ...formData, showHoursField: c })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>"Fest verbaut" Option</Label>
                                <p className="text-sm text-muted-foreground">Checkbox für feste Verkabelung anzeigen?</p>
                            </div>
                            <Switch
                                checked={formData.showFixedOption}
                                onCheckedChange={(c) => setFormData({ ...formData, showFixedOption: c })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Ist ein Kühlgerät</Label>
                                <p className="text-sm text-muted-foreground">Aktiviert spezielle Logik (Kompressor/Absorber)</p>
                            </div>
                            <Switch
                                checked={formData.isCooling}
                                onCheckedChange={(c) => setFormData({ ...formData, isCooling: c })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">Sortierung</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                                className="max-w-[100px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting} size="lg">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Speichern...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Gerät erstellen
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <EmojiPickerModal
                isOpen={isEmojiModalOpen}
                onClose={() => setIsEmojiModalOpen(false)}
                onSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
            />
        </div>
    );
}
