"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCcw, Pause, Play, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { updateProductFromAmazon } from '@/app/actions/product-update';

interface ProductSummary {
    id: string;
    name: string;
    asin?: string | null; // Optional if we just pass IDs
    filterValues?: Record<string, any> | null;
    categoryId: string;
}

interface UpdateProductDialogProps {
    products: ProductSummary[]; // Can be single or multiple
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    allCategoryFilters?: { categoryId: string; key: string; }[]; // Optional to avoid breaking other usages if any
}

type UpdateStatus = 'idle' | 'running' | 'paused' | 'completed';

interface UpdateLog {
    id: string;
    productName: string;
    status: 'success' | 'error' | 'pending';
    message?: string;
}

export function UpdateProductDialog({ products, isOpen, onClose, onSuccess, allCategoryFilters }: UpdateProductDialogProps) {
    const [mode, setMode] = useState<'api' | 'scrape'>('api');
    const [onlyFillMissing, setOnlyFillMissing] = useState(true);
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logs, setLogs] = useState<UpdateLog[]>([]);

    // Analyzed Data
    const [missingCount, setMissingCount] = useState(0);

    const router = useRouter();
    const abortController = useRef<AbortController | null>(null);
    const isPausedRef = useRef(false);

    // Initial Analysis when dialog opens
    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setProgress(0);
            setCurrentIndex(0);
            setLogs([]);
            isPausedRef.current = false;
        }
    }, [isOpen]);

    // Analyze products when they change (Update warning count)
    // We only need this for the "Idle" view warnings, so it's safe to update even if running
    useEffect(() => {
        if (isOpen && products.length > 0) {
            // Strict check if filters are provided, otherwise fallback to loose check
            const count = products.filter(p => {
                const fv = p.filterValues || {};

                if (allCategoryFilters) {
                    const required = allCategoryFilters.filter(cf => cf.categoryId === p.categoryId);
                    if (required.length > 0) {
                        return required.some(req => {
                            const val = fv[req.key];
                            return val === null || val === undefined || val === "";
                        });
                    }
                }

                // Fallback heuristic
                return Object.keys(fv).length < 2;
            }).length;
            setMissingCount(count);
        }
    }, [isOpen, products, allCategoryFilters]);

    const handleStart = async () => {
        setStatus('running');
        isPausedRef.current = false;
        setLogs([]);

        let successCount = 0;

        for (let i = 0; i < products.length; i++) {
            setCurrentIndex(i);
            setProgress(Math.round((i / products.length) * 100));

            // Check Pause
            while (isPausedRef.current) {
                await new Promise(r => setTimeout(r, 500));
                if (!isOpen) return; // Exit if dialog closed
            }

            const product = products[i];

            // Log Pending
            // setLogs(prev => [{ id: product.id, productName: product.name, status: 'pending' }, ...prev]); 

            try {
                // Random Delay for scraping safety (only if scraping or batch > 1 to be safe)
                if (products.length > 1 || mode === 'scrape') {
                    const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3s
                    await new Promise(r => setTimeout(r, delay));
                }

                const result = await updateProductFromAmazon(product.id, mode, { onlyFillMissing });

                if (result.success) {
                    successCount++;
                    setLogs(prev => [{ id: product.id, productName: product.name, status: 'success', message: 'Erfolgreich' }, ...prev.slice(0, 4)]);
                } else {
                    setLogs(prev => [{ id: product.id, productName: product.name, status: 'error', message: result.error || 'Fehler' }, ...prev.slice(0, 4)]);
                }

            } catch (err) {
                console.error(err);
                setLogs(prev => [{ id: product.id, productName: product.name, status: 'error', message: 'Netzwerkfehler' }, ...prev.slice(0, 4)]);
            }
        }

        setProgress(100);
        setStatus('completed');
        if (onSuccess) onSuccess();
        router.refresh();
    };

    const handlePauseToggle = () => {
        if (status === 'running') {
            isPausedRef.current = true;
            setStatus('paused');
        } else if (status === 'paused') {
            isPausedRef.current = false;
            setStatus('running');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && status === 'running') {
                if (!confirm("Update läuft noch. Wirklich abbrechen?")) return;
                isPausedRef.current = true; // Stop loop effectively
            }
            onClose();
        }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Produkte aktualisieren</DialogTitle>
                    <DialogDescription>
                        Aktualisiere {products.length} Produkte via Amazon {mode === 'api' ? 'API' : 'Scraper'}.
                    </DialogDescription>
                </DialogHeader>

                {status === 'idle' ? (
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-4">
                            {/* Analysis Alert */}
                            {missingCount > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-amber-800 dark:text-amber-200">
                                            {missingCount} Produkte haben scheinbar fehlende Filter-Werte.
                                        </p>
                                        <p className="text-amber-700 dark:text-amber-300">
                                            Empfehlung: Nutzen Sie die Option "Nur fehlende Werte ergänzen".
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Methode</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={mode === 'api' ? 'default' : 'outline'}
                                        onClick={() => setMode('api')}
                                        className="flex-1"
                                    >
                                        Via API (Schnell)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={mode === 'scrape' ? 'default' : 'outline'}
                                        onClick={() => setMode('scrape')}
                                        className="flex-1"
                                    >
                                        Via Scraper (Langsam & Sicher)
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Nutze den Scraper, falls die API keine Daten liefert oder Limits erreicht sind.
                                    Scraping enthält Sicherheits-Pausen.
                                </p>
                            </div>

                            <div className="flex items-center space-x-2 border p-3 rounded-md">
                                <Checkbox
                                    id="fillMissing"
                                    checked={onlyFillMissing}
                                    onCheckedChange={(c) => setOnlyFillMissing(c === true)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="fillMissing" className="font-medium cursor-pointer">
                                        Nur fehlende Werte ergänzen
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Bestehende Daten (Name, Beschreibung, gesetzte Filter) werden <b>nicht</b> überschrieben.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Fortschritt ({currentIndex} / {products.length})</span>
                                <span className="font-mono">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>

                        {status !== 'completed' && (
                            <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px] text-center">
                                {products[currentIndex] && (
                                    <>
                                        <Loader2 className={`h-8 w-8 text-primary mb-3 ${status === 'running' ? 'animate-spin' : ''}`} />
                                        <p className="font-medium">{products[currentIndex].name}</p>
                                        <p className="text-sm text-muted-foreground">Wird analysiert...</p>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="bg-card border rounded-md p-0 overflow-hidden text-sm">
                            <div className="px-3 py-2 bg-muted/30 border-b font-medium">Log (Letzte 5)</div>
                            <div className="max-h-[150px] overflow-y-auto p-2 space-y-2">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                        {log.status === 'success' ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                        )}
                                        <div>
                                            <p className="font-medium line-clamp-1">{log.productName}</p>
                                            {log.message && <p className="text-xs text-muted-foreground">{log.message}</p>}
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <p className="text-muted-foreground text-center py-2">Warte auf Start...</p>}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between">
                    {status === 'idle' ? (
                        <>
                            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
                            <Button onClick={handleStart}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Aktualisierung Starten
                            </Button>
                        </>
                    ) : (
                        <>
                            {status === 'completed' ? (
                                <Button onClick={onClose} className="w-full">Schließen</Button>
                            ) : (
                                <Button variant="outline" onClick={handlePauseToggle} className="w-full sm:w-auto">
                                    {status === 'paused' ? (
                                        <>
                                            <Play className="h-4 w-4 mr-2" /> Fortsetzen
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="h-4 w-4 mr-2" /> Pause
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
