"use client";

import { useState } from "react";
import { Download } from "lucide-react";

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
import { SimpleSelect } from "@/components/ui/simple-select";

type Props = {
  categories: { id: string; name: string }[];
};

export function AdminProductImportDialog({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [input, setInput] = useState("");

  const selectStyles =
    "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Download className="mr-2 size-4" aria-hidden />
          Amazon-Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produkt von Amazon importieren</DialogTitle>
          <DialogDescription>
            Gib eine ASIN oder einen Produkt-Link ein. Stammdaten werden automatisch befüllt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imp-cat">Kategorie</Label>
            {categories.length === 0 ? (
              <p id="imp-cat" className="text-sm text-muted-foreground">
                Keine Kategorien vorhanden.
              </p>
            ) : (
              <SimpleSelect
                id="imp-cat"
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                triggerClassName={selectStyles}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="imp-in">ASIN oder Amazon-URL</Label>
            <Input
              id="imp-in"
              placeholder="B08XYZ1234 oder https://www.amazon.de/…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Der Import wird in PS-8 aktiv geschaltet (Amazon Product Advertising API).
            </p>
          </div>
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={() => setNotice("Amazon-Import wird in PS-8 ausgeliefert.")}
            disabled={input.trim().length === 0 || categoryId.length === 0}
          >
            Importieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
