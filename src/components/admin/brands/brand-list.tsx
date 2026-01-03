"use client";

import { Brand, deleteBrand, updateBrand } from "@/app/actions/brands";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditBrandDialog } from "./edit-brand-dialog";

interface BrandListProps {
    initialBrands: Brand[];
}

export function BrandList({ initialBrands }: BrandListProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Wirklich löschen?")) return;
        setIsLoading(id);
        await deleteBrand(id);
        setIsLoading(null);
        router.refresh();
    };

    const handleToggleActive = async (brand: Brand) => {
        await updateBrand(brand.id, { isActive: !brand.isActive });
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Alle Marken</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Im Wizard</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialBrands.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Keine Marken definiert.
                                </TableCell>
                            </TableRow>
                        )}
                        {initialBrands.map((brand) => {
                            // Helper to check types (supporting both new 'types' and legacy 'type')
                            const hasType = (t: string) =>
                                brand.types?.includes(t) || brand.type === t || brand.type === 'BOTH';

                            return (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {brand.showInPreferences ? (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                                                    Ja
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Nein
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={brand.isActive}
                                                onCheckedChange={() => handleToggleActive(brand)}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {brand.isActive ? 'Aktiv' : 'Inaktiv'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <EditBrandDialog brand={brand} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(brand.id)}
                                                disabled={isLoading === brand.id}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
