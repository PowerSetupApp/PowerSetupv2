'use client';

/**
 * Import Product Dialog
 * Modal for importing products via Amazon (Mock) with AI extraction.
 * User selects category, enters ASIN, and gets redirected to edit page.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ExternalLink, Plus } from 'lucide-react';
import { importProductFromAmazon, getCategoriesForImport } from '@/app/actions/product-import';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    slug: string;
}

export function ImportProductDialog() {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState('');
    const [asinInput, setAsinInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'creating'>('idle');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Fetch categories when dialog opens
    useEffect(() => {
        if (open && categories.length === 0) {
            getCategoriesForImport().then(setCategories);
        }
    }, [open, categories.length]);

    const handleImport = async (e: React.FormEvent, mode: 'api' | 'scrape' = 'api') => {
        e.preventDefault();
        if (!categoryId || !asinInput.trim()) return;

        setIsImporting(true);
        setError(null);

        try {
            // Visual feedback stages
            setImportStatus('fetching');
            if (mode === 'scrape') {
                // Slightly longer delay message for scraping to indicate it works
                await new Promise((r) => setTimeout(r, 500));
            } else {
                await new Promise((r) => setTimeout(r, 300));
            }

            setImportStatus('analyzing');
            const result = await importProductFromAmazon(asinInput, categoryId, mode);

            if (result.success && result.productId) {
                setImportStatus('creating');
                await new Promise((r) => setTimeout(r, 300));

                // Close dialog and redirect (with suggested brand if applicable)
                setOpen(false);
                const baseUrl = `/admin/products/${result.productId}`;
                const suggestedBrand = result.extractedData?.suggestedBrandName;
                const url = suggestedBrand
                    ? `${baseUrl}?suggestedBrand=${encodeURIComponent(suggestedBrand)}`
                    : baseUrl;
                router.push(url);
            } else {
                setError(result.error || 'Import fehlgeschlagen.');
                setImportStatus('idle');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
            setImportStatus('idle');
        } finally {
            setIsImporting(false);
        }
    };

    const resetForm = () => {
        setCategoryId('');
        setAsinInput('');
        setError(null);
        setImportStatus('idle');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen);
                if (!newOpen) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neues Produkt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={(e) => handleImport(e, 'api')}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Produkt importieren
                        </DialogTitle>
                        <DialogDescription>
                            Importiere ein Produkt von Amazon mit KI-Unterstützung. Wähle die
                            Kategorie und gib die ASIN oder URL ein.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Category Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="category">Kategorie *</Label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                                required
                                disabled={isImporting}
                            >
                                <option value="">Kategorie wählen...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Die Kategorie bestimmt, welche technischen Daten extrahiert werden.
                            </p>
                        </div>

                        {/* ASIN Input */}
                        <div className="grid gap-2">
                            <Label htmlFor="asin">ASIN oder Amazon-Link *</Label>
                            <Input
                                id="asin"
                                value={asinInput}
                                onChange={(e) => setAsinInput(e.target.value)}
                                placeholder="B075NQQRPD oder https://amazon.de/dp/..."
                                required
                                disabled={isImporting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Test-ASINs: <code>B075NQQRPD</code> (MPPT),{' '}
                                <code>B09LIONBAT</code> (LiFePO4), <code>B08VICINV2</code> (Inverter)
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Import Status */}
                        {isImporting && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>
                                    {importStatus === 'fetching' && 'Amazon-Daten abrufen...'}
                                    {importStatus === 'analyzing' && 'KI analysiert Produktdaten...'}
                                    {importStatus === 'creating' && 'Produkt wird erstellt...'}
                                </span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isImporting}
                                className="flex-1 sm:flex-none"
                            >
                                Abbrechen
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => handleImport(e, 'scrape')}
                                disabled={isImporting || !categoryId || !asinInput.trim()}
                                className="flex-1 sm:flex-none"
                                title="Alternative Methode falls API nicht geht"
                            >
                                Scrape (Backup)
                            </Button>
                        </div>
                        <Link href="/admin/products/new" className="sm:hidden">
                            <Button type="button" variant="ghost" className="w-full">
                                Manuell erstellen
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isImporting || !categoryId || !asinInput.trim()}>
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importieren...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Importieren
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
