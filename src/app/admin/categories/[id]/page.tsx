
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Smile, Trash2 } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        icon: "",
        sortOrder: "0",
    });

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await fetch(`/api/admin/categories/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Kategorie nicht gefunden");
                    }
                    throw new Error("Fehler beim Laden der Kategorie");
                }
                const data = await response.json();
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    icon: data.icon || "",
                    sortOrder: data.sortOrder.toString(),
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [id]);

    const handleNameChange = (name: string) => {
        // Only auto-update slug if it matches the generated slug of the *previous* name
        // ...actually for edit mode, maybe we strictly don't auto-update slug to avoid breaking URLs?
        // Let's manually update name, but keep slug unless user changes it.
        // Or simpler: just update name. User can manually change slug if they strictly want to.
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-xl space-y-6">
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
                <div className="bg-card rounded-xl border p-6 space-y-4">
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
