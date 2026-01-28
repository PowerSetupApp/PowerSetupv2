"use client";

import { createBrand } from "@/app/actions/brands";
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddBrandDialog() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [types, setTypes] = useState<string[]>(["CHARGER", "BATTERY", "SOLAR"]);
    const [showInPreferences, setShowInPreferences] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createBrand(name, types, showInPreferences);
            setOpen(false);
            setName("");
            setTypes(["CHARGER", "BATTERY", "SOLAR"]);
            setShowInPreferences(false);
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
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Marke hinzufügen
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Neue Marke erstellen</DialogTitle>
                        <DialogDescription>
                            Füge eine neue Marke hinzu, die im Wizard zur Auswahl steht.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="z.B. Victron Energy"
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2 pt-2">
                            <Label htmlFor="showInPreferences" className="flex flex-col space-y-1">
                                <span>Im Wizard anzeigen</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Marke in den Auswahl-Listen anzeigen?
                                </span>
                            </Label>
                            <Switch
                                id="showInPreferences"
                                checked={showInPreferences}
                                onCheckedChange={setShowInPreferences}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Speichert..." : "Erstellen"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
