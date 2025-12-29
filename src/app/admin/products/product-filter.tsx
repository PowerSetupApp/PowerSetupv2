"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    const onValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("categoryId");
        } else {
            params.set("categoryId", value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="w-[200px]">
            <Select value={currentCategory} onValueChange={onValueChange}>
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
    );
}
