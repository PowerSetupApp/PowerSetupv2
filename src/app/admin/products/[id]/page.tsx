"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Smile, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MediaModal } from "@/components/admin/media-modal";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";
import { getGeneralSettings } from "@/app/actions/general-settings";
import { getAmazonLink } from "@/lib/amazon-link-helper";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    imageUrl: string | null;
    affiliateUrl: string;
    price: number | null;
    categoryId: string;
    specs: string;
    isActive: boolean;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
    const [partnerTag, setPartnerTag] = useState<string>("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
        imageUrl: "",
        affiliateUrl: "",
        price: "",
        categoryId: "",
        specs: "",
        isActive: true,
    });

    useEffect(() => {
        // Fetch product, categories, and settings
        Promise.all([
            fetch(`/api/admin/products/${id}`).then((res) => res.json()),
            fetch("/api/admin/categories").then((res) => res.json()),
            getGeneralSettings()
        ])
            .then(([product, cats, settings]: [Product, Category[], { amazonPartnerTag: string }]) => {
                setFormData({
                    name: product.name,
                    description: product.description || "",
                    icon: product.icon || "",
                    imageUrl: product.imageUrl || "",
                    affiliateUrl: product.affiliateUrl,
                    price: (product.price !== null && product.price !== undefined) ? product.price.toString() : "",
                    categoryId: product.categoryId,
                    specs: product.specs || "",
                    isActive: product.isActive,
                });
                setCategories(cats);
                setPartnerTag(settings.amazonPartnerTag);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Produkt nicht gefunden");
                setIsLoading(false);
            });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setFieldErrors({});

        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    icon: formData.icon,
                    imageUrl: formData.imageUrl,
                    affiliateUrl: formData.affiliateUrl,
                    price: formData.price ? parseFloat(formData.price) : null,
                    categoryId: formData.categoryId,
                    specs: formData.specs,
                    isActive: formData.isActive,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.details?.fieldErrors) {
                    setFieldErrors(data.details.fieldErrors);
                    throw new Error("Bitte überprüfen Sie die Eingaben.");
                }
                throw new Error(data.error || "Fehler beim Speichern");
            }

            router.push("/admin/products");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Möchten Sie dieses Produkt wirklich unwiderruflich löschen?")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Fehler beim Löschen");

            router.push("/admin/products");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Fehler beim Löschen des Produkts");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const amazonLink = formData.affiliateUrl
        ? getAmazonLink(formData.affiliateUrl, partnerTag)
        : null;

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Produkt bearbeiten</h1>
                    <p className="text-muted-foreground">{formData.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {amazonLink && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Bei Amazon ansehen
                            </a>
                        </Button>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting || isSubmitting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                    </Button>
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
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
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
                            value={formData.price || ""}
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

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="isActive">Produkt ist aktiv</Label>
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
                        <Label htmlFor="affiliateUrl">Amazon Link *</Label>
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
                    <h2 className="font-semibold">Technische Spezifikationen (Markdown)</h2>
                    <Textarea
                        value={formData.specs}
                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                        rows={8}
                        className="font-mono text-sm"
                    />
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
                        <Link href="/admin/products">Abbrechen</Link>
                    </Button>
                </div>
            </form>

            <MediaModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            <EmojiPickerModal
                isOpen={isEmojiModalOpen}
                onClose={() => setIsEmojiModalOpen(false)}
                onSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
            />
        </div>
    );
}
