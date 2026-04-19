"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/ui/simple-select";
import { cn } from "@/lib/utils";

export type AdminProductCategoryFilterField = {
  id: string;
  name: string;
  key: string;
  type: string;
  unit: string | null;
  options: string[];
};

export type AdminProductBrandOption = { id: string; name: string };

type FilterFieldProps = {
  filter: AdminProductCategoryFilterField;
  value: unknown;
  onChange: (value: unknown) => void;
  brands?: AdminProductBrandOption[];
  onAddBrand?: (name: string) => Promise<AdminProductBrandOption | null>;
};

function normalizeType(raw: string): "text" | "number" | "select" | "multiselect" | "brand" {
  const t = raw.toLowerCase();
  if (t === "number" || t === "select" || t === "multiselect" || t === "brand") return t;
  return "text";
}

const selectClass = cn(
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm",
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
);

export function AdminProductFilterField({ filter, value, onChange, brands = [], onAddBrand }: FilterFieldProps) {
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  async function handleCreateBrand() {
    if (!newBrandName.trim() || !onAddBrand) return;
    setIsCreatingBrand(true);
    try {
      const created = await onAddBrand(newBrandName.trim());
      if (created) {
        onChange(created.id);
        setNewBrandName("");
        setIsAddingBrand(false);
      }
    } finally {
      setIsCreatingBrand(false);
    }
  }

  const type = normalizeType(filter.type);

  switch (type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={`ff-${filter.id}`}>{filter.name}</Label>
          <Input
            id={`ff-${filter.id}`}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${filter.name} …`}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={`ff-${filter.id}`}>
            {filter.name}
            {filter.unit ? <span className="ml-1 text-muted-foreground">({filter.unit})</span> : null}
          </Label>
          <Input
            id={`ff-${filter.id}`}
            type="number"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" ? null : Number.parseFloat(raw));
            }}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={`ff-${filter.id}`}>
            {filter.name}
            {filter.unit ? <span className="ml-1 text-muted-foreground">({filter.unit})</span> : null}
          </Label>
          <SimpleSelect
            id={`ff-${filter.id}`}
            value={(value as string) || ""}
            onValueChange={(v) => onChange(v || null)}
            emptyOptionLabel="Bitte wählen …"
            options={filter.options.map((opt) => ({ value: opt, label: opt }))}
            triggerClassName={selectClass}
          />
        </div>
      );

    case "multiselect": {
      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          <Label>
            {filter.name}
            {filter.unit ? <span className="ml-1 text-muted-foreground">({filter.unit})</span> : null}
          </Label>
          <div className="flex flex-wrap gap-3">
            {filter.options.map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={selectedValues.includes(opt)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter((v) => v !== opt);
                    onChange(next.length ? next : null);
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "brand":
      return (
        <div className="space-y-2">
          <Label>{filter.name}</Label>
          {isAddingBrand ? (
            <div className="flex flex-wrap gap-2">
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Markenname …"
                className="min-w-[12rem] flex-1"
              />
              <Button type="button" size="sm" onClick={() => void handleCreateBrand()} disabled={isCreatingBrand || !newBrandName.trim()}>
                {isCreatingBrand ? <Loader2 className="size-4 animate-spin" /> : "Anlegen"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingBrand(false);
                  setNewBrandName("");
                }}
              >
                Abbrechen
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <SimpleSelect
                value={(value as string) || ""}
                onValueChange={(v) => onChange(v || null)}
                emptyOptionLabel="Keine Marke"
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
                triggerClassName={cn(selectClass, "min-w-0 flex-1")}
              />
              {onAddBrand ? (
                <Button type="button" size="icon" variant="outline" onClick={() => setIsAddingBrand(true)} title="Neue Marke">
                  <Plus className="size-4" />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
