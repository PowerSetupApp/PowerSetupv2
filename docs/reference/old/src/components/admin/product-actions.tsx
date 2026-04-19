"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Eye } from "lucide-react";
import { getAmazonLink } from "@/lib/amazon-link-helper";

interface ProductActionsProps {
    product: {
        id: string;
        affiliateUrl: string | null;
    };
    variant?: "dropdown" | "buttons";
    partnerTag?: string;
}

export function ProductActions({ product, variant = "buttons", partnerTag }: ProductActionsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Möchten Sie dieses Produkt wirklich unwiderruflich löschen?")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/products/${product.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Fehler beim Löschen");

            router.refresh();
            // If we are on the edit page, we might want to redirect, but this component is generic.
            // For now, router.refresh() handles the list view. 
            // If used in Edit page, the parent might need to handle redirect or this component needs a prop for it.
        } catch (error) {
            console.error(error);
            alert("Fehler beim Löschen des Produkts");
        } finally {
            setIsDeleting(false);
        }
    };

    const amazonLink = product.affiliateUrl
        ? getAmazonLink(product.affiliateUrl, partnerTag)
        : null;

    if (variant === "dropdown") {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Aktionen öffnen</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {amazonLink && (
                        <DropdownMenuItem asChild>
                            <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Bei Amazon ansehen
                            </a>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Bearbeiten
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600 focus:text-red-600"
                        disabled={isDeleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? "Wird gelöscht..." : "Löschen"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {amazonLink && (
                <Button variant="outline" size="sm" asChild>
                    <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" />
                        Amazon Link
                    </a>
                </Button>
            )}
            <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "..." : "Löschen"}
            </Button>
        </div>
    );
}
