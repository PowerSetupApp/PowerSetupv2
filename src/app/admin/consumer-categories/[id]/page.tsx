
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Smile, Trash2 } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

export default function EditConsumerCategoryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        icon: "⚡",
        slug: "",
        sortOrder: "0",
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch(`/api/admin/consumer-categories/${id}`);
                if (!res.ok) throw new Error("Failed to load category");

                const data = await res.json();
                setFormData({
                    name: data.name,
                    icon: data.icon || "⚡",
                    slug: data.slug,
                    sortOrder: data.sortOrder.toString(),
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
            const res = await fetch(`/api/admin/consumer-categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Fehler beim Speichern");
            router.push("/admin/consumer-categories");
            router.refresh();
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Möchten Sie diese Kategorie wirklich löschen?")) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/consumer-categories/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Fehler beim Löschen");
            router.push("/admin/consumer-categories");
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
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/consumer-categories">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Kategorie bearbeiten</h1>
                    </div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (Kennung)</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Die Kennung kann nicht geändert werden.
                        </p>
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
                                Icon wählen
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
