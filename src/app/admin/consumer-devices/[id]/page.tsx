
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, Smile, Trash2 } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

interface Category {
    id: string;
    name: string;
}

export default function EditConsumerDevicePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    // Default Values
    const [formData, setFormData] = useState({
        name: "",
        i18nKey: "",
        icon: "⚡",
        categoryId: "",

        defaultPower: "50",
        defaultVoltage: "12V",
        defaultHoursPerDay: "2",
        stepHours: "0.5",

        showHoursField: true,
        showFixedOption: true,
        isCooling: false,

        sortOrder: "0",
        isActive: true,
        isFeatured: false,
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [catRes, devRes] = await Promise.all([
                    fetch("/api/admin/consumer-categories"),
                    fetch(`/api/admin/consumer-devices/${id}`)
                ]);

                if (!catRes.ok) throw new Error("Failed to load categories");
                if (!devRes.ok) throw new Error("Failed to load device");

                const categoriesData = await catRes.json();
                const deviceData = await devRes.json();

                setCategories(categoriesData);
                setFormData({
                    name: deviceData.name,
                    i18nKey: deviceData.i18nKey || "",
                    icon: deviceData.icon || "⚡",
                    categoryId: deviceData.categoryId,
                    defaultPower: deviceData.defaultPower.toString(),
                    defaultVoltage: ['12V', '24V', '48V'].includes(deviceData.defaultVoltage) ? 'user' : deviceData.defaultVoltage,
                    defaultHoursPerDay: deviceData.defaultHoursPerDay.toString(),
                    stepHours: deviceData.stepHours.toString(),
                    showHoursField: deviceData.showHoursField,
                    showFixedOption: deviceData.showFixedOption,
                    isCooling: deviceData.isCooling,
                    sortOrder: deviceData.sortOrder.toString(),
                    isActive: deviceData.isActive,
                    isFeatured: deviceData.isFeatured,
                });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/admin/consumer-devices/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Fehler beim Speichern");
            router.push("/admin/consumer-devices");
            router.refresh();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Möchten Sie dieses Gerät wirklich löschen?")) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/consumer-devices/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Fehler beim Löschen");
            router.push("/admin/consumer-devices");
            router.refresh();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/consumer-devices">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Gerät bearbeiten</h1>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                </Button>
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
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            <Label htmlFor="defaultHoursPerDay">Nutzungsdauer (Std/Tag) *</Label>
                            <Input
                                id="defaultHoursPerDay"
                                type="number"
                                value={formData.defaultHoursPerDay}
                                onChange={(e) => setFormData({ ...formData, defaultHoursPerDay: e.target.value })}
                                required
                                step="0.1"
                                min="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stepHours">Schrittweite (Stunden)</Label>
                            <Input
                                id="stepHours"
                                type="number"
                                value={formData.stepHours}
                                onChange={(e) => setFormData({ ...formData, stepHours: e.target.value })}
                                step="0.1"
                                min="0.1"
                            />
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
                                <Label>Sichtbar (Aktiv)</Label>
                                <p className="text-sm text-muted-foreground">Gerät im Wizard anzeigen?</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
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
                                Änderungen speichern
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
