"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Image as ImageIcon, Smile, Trash2, ExternalLink, Sparkles, Save, RefreshCcw } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { MediaModal } from "@/components/admin/media-modal";
import { EmojiPickerModal } from "@/components/admin/emoji-picker-modal";
import { getGeneralSettings } from "@/app/actions/general-settings";
import { getBrands, createBrand, Brand } from "@/app/actions/brands";
import { getAmazonLink } from "@/lib/amazon-link-helper";
import { FilterField, CategoryFilter } from "@/components/admin/filter-field";
import { UpdateProductDialog } from "@/components/admin/products/update-product-dialog";

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
    // Filter fields
    powerW: number | null;
    capacityAh: number | null;
    voltageV: number | null;
    batteryType: string | null;
    currentA: number | null;
    crossSectionMm2: number | null;
    solarWp: number | null;
    supportedVoltages: number[] | null;
    maxDischargeA: number | null;
    waveform: string | null;
    fuseType: string | null;
    asin: string | null;
    // New fields
    brandId: string | null;
    filterValues?: Record<string, any>;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const suggestedBrandFromUrl = searchParams.get('suggestedBrand');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [partnerTag, setPartnerTag] = useState<string>("");
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isCreatingBrand, setIsCreatingBrand] = useState(false);
    const [suggestedBrand, setSuggestedBrand] = useState<string | null>(suggestedBrandFromUrl);

    // Dynamic Filters State
    const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});

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
        // Filter fields (Legacy support)
        powerW: "",
        capacityAh: "",
        voltageV: "",
        batteryType: "",
        currentA: "",
        crossSectionMm2: "",
        solarWp: "",
        supportedVoltages: [] as number[],
        maxDischargeA: "",
        waveform: "pure_sine",
        fuseType: "thermal",
        asin: "",
        brandId: "",
    });

    // Load filters when category changes
    useEffect(() => {
        if (formData.categoryId) {
            fetch(`/api/admin/categories/${formData.categoryId}/filters`)
                .then((res) => res.json())
                .then((data) => {
                    setCategoryFilters(data);
                    // DONT reset filterValues here, as this runs on initial load too.
                    // Reset is handled in the Select onChange.
                })
                .catch(console.error);
        } else {
            setCategoryFilters([]);
        }
    }, [formData.categoryId]);

    useEffect(() => {
        // Fetch product, categories, brands, and settings
        Promise.all([
            fetch(`/api/admin/products/${id}`).then((res) => res.json()),
            fetch("/api/admin/categories").then((res) => res.json()),
            getBrands(),
            getGeneralSettings()
        ])
            .then(async ([product, cats, fetchedBrands, settings]: [Product, Category[], Brand[], { amazonPartnerTag: string }]) => {
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
                    // Legacy values
                    powerW: product.powerW?.toString() || "",
                    capacityAh: product.capacityAh?.toString() || "",
                    voltageV: product.voltageV?.toString() || "",
                    batteryType: product.batteryType || "lifepo4",
                    currentA: product.currentA?.toString() || "",
                    crossSectionMm2: product.crossSectionMm2?.toString() || "",
                    solarWp: product.solarWp?.toString() || "",
                    supportedVoltages: (product.supportedVoltages as number[]) || [],
                    maxDischargeA: product.maxDischargeA?.toString() || "",
                    waveform: product.waveform || "pure_sine",
                    fuseType: product.fuseType || "thermal",
                    asin: product.asin || "",
                    brandId: product.brandId || "",
                });
                setCategories(cats);
                setBrands(fetchedBrands);
                setPartnerTag(settings.amazonPartnerTag);

                // Initialize filterValues from product.filterValues OR map from legacy columns
                const initialValues: Record<string, any> = product.filterValues || {};

                // Legacy Mapping (Sync old columns to new filters if missing)
                // "brand" -> product.brandId
                if (!initialValues['brand'] && product.brandId) initialValues['brand'] = product.brandId;

                // Map legacy fields if they exist and filterValues are empty
                // 'maxPowerWp'
                if (!initialValues['maxPowerWp'] && product.solarWp) initialValues['maxPowerWp'] = product.solarWp;
                if (!initialValues['maxPowerWp'] && product.powerW) initialValues['maxPowerWp'] = product.powerW;

                // 'voltageV'
                if (initialValues['voltageV'] === undefined && product.voltageV) initialValues['voltageV'] = product.voltageV;

                // 'capacityAh'
                if (initialValues['capacityAh'] === undefined && product.capacityAh) initialValues['capacityAh'] = product.capacityAh;

                // 'batteryType'
                if (initialValues['batteryType'] === undefined && product.batteryType) initialValues['batteryType'] = product.batteryType;

                setFilterValues(initialValues);
                // NOTE: Category filters are fetched by useEffect when formData.categoryId is set

                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Produkt nicht gefunden");
                setIsLoading(false);
            });
    }, [id]);

    const handleAddBrand = async (name: string): Promise<Brand | null> => {
        try {
            const res = await fetch("/api/admin/brands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, isActive: true }),
            });
            if (res.ok) {
                const newBrand = await res.json();
                setBrands(prev => [...prev, newBrand]);
                return newBrand;
            }
        } catch (err) {
            console.error("Error creating brand:", err);
        }
        return null;
    };

    // Handler for creating a new brand from suggestion (Legacy/Duplicate of FilterField internal?)
    // Leaving it for "suggestedBrand" feature which might be external to filters
    const handleCreateSuggestedBrand = async () => {
        if (!suggestedBrand) return;
        setIsCreatingBrand(true);
        try {
            // ... Logic simplified, just reuse handleAddBrand if possible or keep logic
            // It detects types based on slug.
            const selectedCategory = categories.find(c => c.id === formData.categoryId);
            const slug = selectedCategory?.slug || "";
            let types: string[] = ["CHARGER"];
            if (slug.includes("batterie")) types = ["BATTERY"];
            else if (slug.includes("solar")) types = ["SOLAR"];

            const result = await createBrand(suggestedBrand, types, true);
            if (result.success) {
                const updatedBrands = await getBrands();
                setBrands(updatedBrands);
                // If using dynamic filters, update filterValues['brand']
                const newBrand = updatedBrands.find(b => b.name.toLowerCase() === suggestedBrand.toLowerCase());
                if (newBrand) {
                    setFormData({ ...formData, brandId: newBrand.id });
                    setFilterValues(prev => ({ ...prev, brand: newBrand.id }));
                }
                setSuggestedBrand(null);
                const url = new URL(window.location.href);
                url.searchParams.delete('suggestedBrand');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreatingBrand(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setFieldErrors({});

        // Sync back dynamic values to legacy columns for safety
        const legacyUpdates: any = {};
        if (filterValues['brand']) legacyUpdates.brandId = filterValues['brand'];
        if (filterValues['maxPowerWp']) {
            // Ambiguity: is it solarWp of powerW?
            // Check category slug
            const cat = categories.find(c => c.id === formData.categoryId);
            if (cat?.slug.includes('solar')) legacyUpdates.solarWp = filterValues['maxPowerWp'];
            else if (cat?.slug.includes('wechselrichter')) legacyUpdates.powerW = filterValues['maxPowerWp'];
        }
        if (filterValues['voltageV']) {
            const val = filterValues['voltageV'];
            // If string "12V", parse to 12
            if (typeof val === 'string') {
                const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
                if (!isNaN(parsed)) legacyUpdates.voltageV = parsed;
            } else if (typeof val === 'number') {
                legacyUpdates.voltageV = val;
            }
        }
        if (filterValues['capacityAh']) {
            const val = filterValues['capacityAh'];
            if (typeof val === 'string') {
                const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
                if (!isNaN(parsed)) legacyUpdates.capacityAh = parsed;
            } else if (typeof val === 'number') {
                legacyUpdates.capacityAh = val;
            }
        }
        if (filterValues['batteryType']) legacyUpdates.batteryType = filterValues['batteryType'];
        if (filterValues['currentA']) legacyUpdates.currentA = filterValues['currentA']; // Charger current
        // ... add more if needed

        const payload = {
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            imageUrl: formData.imageUrl,
            affiliateUrl: formData.affiliateUrl,
            price: formData.price ? parseFloat(formData.price) : null,
            categoryId: formData.categoryId,
            specs: formData.specs,
            isActive: formData.isActive,
            // Legacy fields (from formData OR synced)
            powerW: legacyUpdates.powerW || (formData.powerW ? parseInt(formData.powerW) : null),
            capacityAh: legacyUpdates.capacityAh || (formData.capacityAh ? parseInt(formData.capacityAh) : null),
            voltageV: legacyUpdates.voltageV || (formData.voltageV ? parseInt(formData.voltageV) : null),
            batteryType: legacyUpdates.batteryType || (formData.batteryType && formData.batteryType !== "" ? formData.batteryType : null),
            currentA: legacyUpdates.currentA || (formData.currentA ? parseInt(formData.currentA) : null),
            crossSectionMm2: formData.crossSectionMm2 ? parseFloat(formData.crossSectionMm2) : null,
            solarWp: legacyUpdates.solarWp || (formData.solarWp ? parseInt(formData.solarWp) : null),
            supportedVoltages: formData.supportedVoltages && formData.supportedVoltages.length > 0 ? formData.supportedVoltages : null,
            maxDischargeA: formData.maxDischargeA ? parseInt(formData.maxDischargeA) : null,
            waveform: formData.waveform || null,
            fuseType: formData.fuseType || null,
            asin: formData.asin || null,
            brandId: legacyUpdates.brandId || formData.brandId || null,

            // NEW: Send filterValues
            filterValues: filterValues
        };

        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.details?.fieldErrors) {
                    setFieldErrors(data.details.fieldErrors);
                    throw new Error("Bitte überprüfen Sie die Eingaben.");
                }
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                throw new Error(errorMsg || "Fehler beim Speichern");
            }

            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Möchten Sie dieses Produkt wirklich unwiderruflich löschen?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Fehler beim Löschen");
            router.push("/admin/products");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Fehler beim Löschen des Produkts");
            setIsDeleting(false);
        }
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

    // ASIN extraction helper
    const extractAsinFromUrl = (url: string): string | null => {
        const match = url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
        return match ? match[1].toUpperCase() : null;
    };

    const handleAffiliateUrlChange = (url: string) => {
        const asin = extractAsinFromUrl(url);
        setFormData({ ...formData, affiliateUrl: url, asin: asin || "" });
    };

    const amazonLink = formData.affiliateUrl
        ? getAmazonLink(formData.affiliateUrl, partnerTag)
        : null;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsUpdateDialogOpen(true)}
                        title="Daten via Amazon aktualisieren"
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Update
                    </Button>
                    <UpdateProductDialog
                        isOpen={isUpdateDialogOpen}
                        onClose={() => setIsUpdateDialogOpen(false)}
                        products={[{
                            id: id,
                            name: formData.name,
                            filterValues: filterValues,
                            categoryId: formData.categoryId
                        }]}
                        allCategoryFilters={categoryFilters.map(f => ({ categoryId: formData.categoryId, key: f.key }))}
                        onSuccess={() => {
                            // Reload data
                            window.location.reload();
                        }}
                    />

                    {amazonLink && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Amazon
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
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg overflow-auto max-h-40">
                    <p className="font-semibold">{error}</p>
                    {Object.keys(fieldErrors).length > 0 && (
                        <pre className="text-xs mt-2 whitespace-pre-wrap">
                            {JSON.stringify(fieldErrors, null, 2)}
                        </pre>
                    )}
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
                            onChange={(e) => {
                                setFormData({ ...formData, categoryId: e.target.value });
                                setFilterValues({}); // Clear filters only on manual change
                            }}
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

                {/* Dynamic Filters Card */}
                {categoryFilters.length > 0 && (
                    <div className="bg-card rounded-xl border p-6 space-y-4">
                        <div>
                            <h2 className="font-semibold">Filter-Werte</h2>
                            <p className="text-sm text-muted-foreground">
                                Diese Werte werden für die Vorfilterung vor der KI-Auswahl verwendet.
                            </p>
                        </div>

                        {/* Special case: Brand Suggestion from URL (if not matched to brandId) */}
                        {suggestedBrand && !filterValues['brand'] && (
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="font-medium">Marke erkannt: "{suggestedBrand}"</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleCreateSuggestedBrand} disabled={isCreatingBrand}>
                                        {isCreatingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : "Als neue Marke anlegen"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {categoryFilters.map((filter) => (
                                <FilterField
                                    key={filter.id}
                                    filter={filter}
                                    value={filterValues[filter.key]}
                                    onChange={(val) => setFilterValues(prev => ({ ...prev, [filter.key]: val }))}
                                    brands={brands}
                                    onAddBrand={handleAddBrand}
                                />
                            ))}
                        </div>
                    </div>
                )}

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
                            onChange={(e) => handleAffiliateUrlChange(e.target.value)}
                            placeholder="https://amazon.de/..."
                            required
                            className={fieldErrors.affiliateUrl ? "border-destructive" : ""}
                        />
                        {fieldErrors.affiliateUrl && (
                            <p className="text-sm text-destructive">{fieldErrors.affiliateUrl[0]}</p>
                        )}

                        <Accordion type="single" collapsible className="mt-3">
                            <AccordionItem value="amazon-details" className="border rounded-lg px-3">
                                <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2">
                                    Amazon Details
                                </AccordionTrigger>
                                <AccordionContent className="pb-3">
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-muted-foreground">ASIN (Amazon Standard Identification Number):</span>
                                            <div className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1">
                                                {formData.asin || <span className="text-muted-foreground italic">Wird aus URL extrahiert</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Wird benötigt für zukünftige Amazon API-Abfragen</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Marketplace:</span>
                                            <div className="text-sm mt-1">🇩🇪 amazon.de</div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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
                        placeholder="### Technische Daten..."
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
                                Speichern
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
