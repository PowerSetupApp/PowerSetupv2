
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Smile, Trash2, Plus, Pencil, X } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

interface CategoryFilter {
    id: string;
    name: string;
    key: string;
    type: "text" | "number" | "select" | "multiselect" | "brand";
    unit: string | null;
    options: string[];
    sortOrder: number;
}

const FILTER_TYPES = [
    { value: "text", label: "Text" },
    { value: "number", label: "Zahl" },
    { value: "select", label: "Dropdown (Einzelauswahl)" },
    { value: "multiselect", label: "Checkboxen (Mehrfachauswahl)" },
    { value: "brand", label: "Marke (aus Marken-Verwaltung)" },
];

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    // Category form data
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        icon: "",
        sortOrder: "0",
    });

    // Filters state
    const [filters, setFilters] = useState<CategoryFilter[]>([]);
    const [isFilterFormOpen, setIsFilterFormOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState<CategoryFilter | null>(null);
    const [filterForm, setFilterForm] = useState({
        name: "",
        key: "",
        type: "text" as CategoryFilter["type"],
        unit: "",
        options: "",
    });
    const [filterError, setFilterError] = useState<string | null>(null);
    const [isSavingFilter, setIsSavingFilter] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch category
                const catRes = await fetch(`/api/admin/categories/${id}`);
                if (!catRes.ok) {
                    if (catRes.status === 404) throw new Error("Kategorie nicht gefunden");
                    throw new Error("Fehler beim Laden der Kategorie");
                }
                const catData = await catRes.json();
                setFormData({
                    name: catData.name,
                    slug: catData.slug,
                    icon: catData.icon || "",
                    sortOrder: catData.sortOrder.toString(),
                });

                // Fetch filters
                const filtersRes = await fetch(`/api/admin/categories/${id}/filters`);
                if (filtersRes.ok) {
                    const filtersData = await filtersRes.json();
                    setFilters(filtersData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleNameChange = (name: string) => {
        setFormData(prev => ({ ...prev, name }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    icon: formData.icon || undefined,
                    sortOrder: parseInt(formData.sortOrder) || 0,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Fehler beim Speichern");
            }

            router.push("/admin/categories");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Sind Sie sicher, dass Sie diese Kategorie löschen möchten?")) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Fehler beim Löschen");
            }

            router.push("/admin/categories");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            setIsSubmitting(false);
        }
    };

    // Filter functions
    const openAddFilter = () => {
        setEditingFilter(null);
        setFilterForm({ name: "", key: "", type: "text", unit: "", options: "" });
        setFilterError(null);
        setIsFilterFormOpen(true);
    };

    const openEditFilter = (filter: CategoryFilter) => {
        setEditingFilter(filter);
        setFilterForm({
            name: filter.name,
            key: filter.key,
            type: filter.type,
            unit: filter.unit || "",
            options: filter.options.join(", "),
        });
        setFilterError(null);
        setIsFilterFormOpen(true);
    };

    const closeFilterForm = () => {
        setIsFilterFormOpen(false);
        setEditingFilter(null);
        setFilterError(null);
    };

    const generateKey = (name: string) => {
        return name
            .replace(/[äÄ]/g, "ae")
            .replace(/[öÖ]/g, "oe")
            .replace(/[üÜ]/g, "ue")
            .replace(/ß/g, "ss")
            .replace(/[^a-zA-Z0-9]/g, "")
            .replace(/^[0-9]+/, "");
    };

    const handleFilterNameChange = (name: string) => {
        const newKey = editingFilter ? filterForm.key : generateKey(name);
        setFilterForm(prev => ({ ...prev, name, key: newKey }));
    };

    const saveFilter = async () => {
        setIsSavingFilter(true);
        setFilterError(null);

        const options = filterForm.options
            .split(",")
            .map(o => o.trim())
            .filter(o => o.length > 0);

        const payload = {
            name: filterForm.name,
            key: filterForm.key,
            type: filterForm.type,
            unit: filterForm.unit || null,
            options,
        };

        try {
            const url = editingFilter
                ? `/api/admin/categories/${id}/filters/${editingFilter.id}`
                : `/api/admin/categories/${id}/filters`;
            const method = editingFilter ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Fehler beim Speichern");
            }

            const savedFilter = await res.json();

            if (editingFilter) {
                setFilters(prev => prev.map(f => f.id === savedFilter.id ? savedFilter : f));
            } else {
                setFilters(prev => [...prev, savedFilter]);
            }

            closeFilterForm();
        } catch (err) {
            setFilterError(err instanceof Error ? err.message : "Unbekannter Fehler");
        } finally {
            setIsSavingFilter(false);
        }
    };

    const deleteFilter = async (filterId: string) => {
        if (!confirm("Filter wirklich löschen?")) return;

        try {
            const res = await fetch(`/api/admin/categories/${id}/filters/${filterId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setFilters(prev => prev.filter(f => f.id !== filterId));
            }
        } catch (err) {
            console.error("Error deleting filter:", err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/categories">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Kategorie bearbeiten</h1>
                        <p className="text-muted-foreground">{formData.name}</p>
                    </div>
                </div>
                <Button variant="destructive" size="icon" onClick={handleDelete} title="Löschen">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Data Card */}
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="font-semibold">Grunddaten</h2>
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="z.B. Batterien"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="z.B. batterien"
                            required
                        />
                        <p className="text-sm text-yellow-600 dark:text-yellow-500">
                            Achtung: Das Ändern des Slugs kann bestehende Links zerstören.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon (Emoji)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🔋"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEmojiModalOpen(true)}
                                >
                                    <Smile className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">Sortierung</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Filter-Definitionen</h2>
                            <p className="text-sm text-muted-foreground">
                                Diese Filter erscheinen beim Bearbeiten von Produkten dieser Kategorie
                            </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={openAddFilter}>
                            <Plus className="h-4 w-4 mr-2" />
                            Filter hinzufügen
                        </Button>
                    </div>

                    {filters.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Noch keine Filter definiert
                        </p>
                    ) : (
                        <div className="divide-y">
                            {filters.map((filter) => (
                                <div key={filter.id} className="py-3 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{filter.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            <code className="bg-muted px-1 rounded">{filter.key}</code>
                                            {" · "}
                                            {FILTER_TYPES.find(t => t.value === filter.type)?.label}
                                            {filter.unit && ` (${filter.unit})`}
                                            {filter.options.length > 0 && (
                                                <span className="ml-2">
                                                    [{filter.options.join(", ")}]
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditFilter(filter)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteFilter(filter.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filter Form (inline) */}
                    {isFilterFormOpen && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                    {editingFilter ? "Filter bearbeiten" : "Neuer Filter"}
                                </h3>
                                <Button type="button" variant="ghost" size="icon" onClick={closeFilterForm}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {filterError && (
                                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
                                    {filterError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                        value={filterForm.name}
                                        onChange={(e) => handleFilterNameChange(e.target.value)}
                                        placeholder="z.B. Max. Leistung"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Key *</Label>
                                    <Input
                                        value={filterForm.key}
                                        onChange={(e) => setFilterForm({ ...filterForm, key: e.target.value })}
                                        placeholder="z.B. maxPowerWp"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Typ *</Label>
                                    <select
                                        value={filterForm.type}
                                        onChange={(e) => setFilterForm({ ...filterForm, type: e.target.value as CategoryFilter["type"] })}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        {FILTER_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Einheit</Label>
                                    <Input
                                        value={filterForm.unit}
                                        onChange={(e) => setFilterForm({ ...filterForm, unit: e.target.value })}
                                        placeholder="z.B. W, A, V"
                                    />
                                </div>
                            </div>

                            {(filterForm.type === "select" || filterForm.type === "multiselect") && (
                                <div className="space-y-2">
                                    <Label>Optionen (kommagetrennt)</Label>
                                    <Input
                                        value={filterForm.options}
                                        onChange={(e) => setFilterForm({ ...filterForm, options: e.target.value })}
                                        placeholder="z.B. LiFePo4, AGM, GEL"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    onClick={saveFilter}
                                    disabled={isSavingFilter || !filterForm.name || !filterForm.key}
                                >
                                    {isSavingFilter ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Speichern
                                </Button>
                                <Button type="button" variant="outline" onClick={closeFilterForm}>
                                    Abbrechen
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
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
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/categories">Abbrechen</Link>
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
