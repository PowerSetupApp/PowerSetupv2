"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Smile, Sparkles } from "lucide-react";
import Link from "next/link";
import { MediaModal } from "@/components/admin/media-modal";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
        imageUrl: "",
        affiliateUrl: "",
        price: "",
        categoryId: "",
        specs: "",
    });

    useEffect(() => {
        fetch("/api/admin/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setFieldErrors({});

        try {


            const response = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    icon: formData.icon,
                    imageUrl: formData.imageUrl,
                    affiliateUrl: formData.affiliateUrl,
                    price: formData.price ? parseFloat(formData.price) : undefined,
                    categoryId: formData.categoryId,
                    specs: formData.specs,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.details?.fieldErrors) {
                    setFieldErrors(data.details.fieldErrors);
                    throw new Error("Bitte überprüfen Sie die Eingaben.");
                }
                throw new Error(data.error || "Fehler beim Erstellen");
            }

            router.push("/admin/products");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            setIsSubmitting(false);
        }
    };

    const handleImageSelect = (url: string) => {
        setFormData({ ...formData, imageUrl: url });
    };

    const handleOptimizeSpecs = async () => {
        if (!formData.specs.trim()) return;
        setIsOptimizing(true);
        try {
            const res = await fetch("/api/admin/optimize-specs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ specs: formData.specs }),
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, specs: data.optimizedSpecs });
            }
        } catch (err) {
            console.error("Optimization failed", err);
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Neues Produkt</h1>
                    <p className="text-muted-foreground">Erstellen Sie ein neues Produkt</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="font-semibold">Grunddaten</h2>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className={fieldErrors.name ? "border-destructive" : ""}
                        />
                        {fieldErrors.name && (
                            <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>
                        )}
                    </div>



                    <div className="space-y-2">
                        <Label htmlFor="categoryId">Kategorie *</Label>
                        <select
                            id="categoryId"
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md bg-background ${fieldErrors.categoryId ? "border-destructive" : ""}`}
                            required
                        >
                            <option value="">Kategorie wählen...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.categoryId && (
                            <p className="text-sm text-destructive">{fieldErrors.categoryId[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Preis (für KI-Kontext) €</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className={fieldErrors.price ? "border-destructive" : ""}
                        />
                        {fieldErrors.price && (
                            <p className="text-sm text-destructive">{fieldErrors.price[0]}</p>
                        )}
                    </div>

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
                </div>

                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="font-semibold">Bild & Links</h2>

                    <div className="space-y-2">
                        <Label>Produktbild</Label>
                        <div className="flex gap-2">
                            <Input
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="Bild aus Mediathek auswählen..."
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsMediaModalOpen(true)}
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Mediathek
                            </Button>
                        </div>
                        {formData.imageUrl && (
                            <div className="mt-2">
                                <img
                                    src={formData.imageUrl}
                                    alt="Vorschau"
                                    className="h-20 w-20 rounded-lg object-cover border"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="affiliateUrl">Affiliate-URL *</Label>
                        <Input
                            id="affiliateUrl"
                            type="url"
                            value={formData.affiliateUrl}
                            onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                            placeholder="https://amazon.de/..."
                            required
                            className={fieldErrors.affiliateUrl ? "border-destructive" : ""}
                        />
                        {fieldErrors.affiliateUrl && (
                            <p className="text-sm text-destructive">{fieldErrors.affiliateUrl[0]}</p>
                        )}
                    </div>
                </div>

                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Technische Spezifikationen (Markdown)</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleOptimizeSpecs}
                            disabled={isOptimizing || !formData.specs.trim()}
                        >
                            {isOptimizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Mit KI optimieren
                        </Button>
                    </div>
                    <Textarea
                        value={formData.specs}
                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                        rows={8}
                        className="font-mono text-sm"
                        placeholder="### Technische Daten
- Spannung: 12V
- Kapazität: 100Ah"
                    />
                    <p className="text-sm text-muted-foreground">
                        Geben Sie hier die technischen Daten im Markdown-Format ein.
                    </p>
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
                                Produkt erstellen
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/products">Abbrechen</Link>
                    </Button>
                </div>
            </form>

            <MediaModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleImageSelect}
            />

            <EmojiPickerModal
                isOpen={isEmojiModalOpen}
                onClose={() => setIsEmojiModalOpen(false)}
                onSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
            />
        </div>
    );
}

