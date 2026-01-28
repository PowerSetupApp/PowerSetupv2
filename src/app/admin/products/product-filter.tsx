"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Category {
    id: string;
    name: string;
}

interface ProductFilterProps {
    categories: Category[];
}

export function ProductFilter({ categories }: ProductFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("categoryId") || "all";
    const currentSearch = searchParams.get("search") || "";

    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // Debounce logic inline if hook doesn't exist
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm === currentSearch) return;

            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) {
                params.set("search", searchTerm);
            } else {
                params.delete("search");
            }
            router.push(`?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, searchParams, router, currentSearch]);

    const onCategoryChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("categoryId");
        } else {
            params.set("categoryId", value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Suchen..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-[200px]">
                <Select value={currentCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Kategorie filtern" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
