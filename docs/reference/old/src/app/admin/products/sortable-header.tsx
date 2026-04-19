"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SortableHeaderProps {
    column: string;
    title: string;
    className?: string;
}

export function SortableHeader({ column, title, className }: SortableHeaderProps) {
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort");
    const currentOrder = searchParams.get("order");

    const isSorted = currentSort === column;
    const isAsc = currentOrder === "asc";
    const nextOrder = isSorted && isAsc ? "desc" : "asc";

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", column);
    params.set("order", nextOrder);

    const Icon = isSorted ? (isAsc ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <Link
            href={`?${params.toString()}`}
            className={cn(
                "flex items-center gap-1 hover:text-foreground transition-colors",
                isSorted ? "text-foreground font-bold" : "text-muted-foreground",
                className
            )}
        >
            {title}
            <Icon className="h-4 w-4" />
        </Link>
    );
}
