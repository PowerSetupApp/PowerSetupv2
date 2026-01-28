"use client";

import { Brand, deleteBrand, updateBrand } from "@/app/actions/brands";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { EditBrandDialog } from "./edit-brand-dialog";

interface BrandListProps {
    initialBrands: Brand[];
}

export function BrandList({ initialBrands }: BrandListProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredBrands = useMemo(() => {
        if (!searchQuery) return initialBrands;
        const lower = searchQuery.toLowerCase();
        return initialBrands.filter(b => b.name.toLowerCase().includes(lower));
    }, [initialBrands, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm("Wirklich löschen?")) return;
        setIsLoading(id);
        await deleteBrand(id);
        setIsLoading(null);
        router.refresh();
    };

    const handleToggleActive = async (brand: Brand) => {
        // Optimistic update could be done here, but router.refresh is safer for now
        await updateBrand(brand.id, { isActive: !brand.isActive });
        router.refresh();
    };

    const handleTogglePreferences = async (brand: Brand) => {
        await updateBrand(brand.id, { showInPreferences: !brand.showInPreferences });
        router.refresh();
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">Alle Marken</CardTitle>
                <div className="relative w-64 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent className="mt-4">
                <div className="rounded-md border">
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
                            {filteredBrands.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Keine Marken gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={brand.showInPreferences}
                                                onCheckedChange={() => handleTogglePreferences(brand)}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {brand.showInPreferences ? 'Ja' : 'Nein'}
                                            </span>
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
