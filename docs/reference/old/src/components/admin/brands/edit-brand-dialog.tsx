"use client";

import { Brand, updateBrand } from "@/app/actions/brands";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EditBrandDialogProps {
    brand: Brand;
}

export function EditBrandDialog({ brand }: EditBrandDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(brand.name);

    const [types, setTypes] = useState<string[]>(
        brand.types && brand.types.length > 0
            ? brand.types
            : ['CHARGER', 'BATTERY', 'SOLAR']
    );
    const [showInPreferences, setShowInPreferences] = useState(brand.showInPreferences);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateBrand(brand.id, { name, types, showInPreferences });
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleType = (type: string) => {
        setTypes(current =>
            current.includes(type)
                ? current.filter(t => t !== type)
                : [...current, type]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Marke bearbeiten</DialogTitle>
                        <DialogDescription>
                            Bearbeite die Details der Marke.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="z.B. Victron Energy"
                                required
                            />
                        </div>


                        <div className="flex items-center justify-between space-x-2 pt-2">
                            <Label htmlFor="edit-showInPreferences" className="flex flex-col space-y-1">
                                <span>Im Wizard anzeigen</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Marke in den Auswahl-Listen anzeigen?
                                </span>
                            </Label>
                            <Switch
                                id="edit-showInPreferences"
                                checked={showInPreferences}
                                onCheckedChange={setShowInPreferences}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Speichert..." : "Speichern"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
