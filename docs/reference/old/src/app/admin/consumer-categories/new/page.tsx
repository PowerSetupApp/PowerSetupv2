
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Smile } from "lucide-react";
import Link from "next/link";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

export default function NewConsumerCategoryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        icon: "⚡",
        sortOrder: "0",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/admin/consumer-categories", {
                method: "POST",
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

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/consumer-categories">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Neue Kategorie</h1>
                </div>
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
                                Erstellen
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
