"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix Select cannot use `""` as an item value; map empty selection through this sentinel. */
export const SELECT_EMPTY_SENTINEL = "__ps_empty__";

export type SimpleSelectOption = { value: string; label: string };

export type SimpleSelectProps = {
  id?: string;
  "aria-labelledby"?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SimpleSelectOption[];
  /** When set, prepends a pseudo-option that maps to `""` on change. */
  emptyOptionLabel?: string;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
};

export function SimpleSelect({
  id,
  "aria-labelledby": ariaLabelledBy,
  value,
  onValueChange,
  options,
  emptyOptionLabel,
  placeholder,
  triggerClassName,
  contentClassName,
  disabled,
}: SimpleSelectProps) {
  const hasEmpty = emptyOptionLabel != null;
  const radixValue = hasEmpty && value === "" ? SELECT_EMPTY_SENTINEL : value;

  const handleChange = (next: string) => {
    if (hasEmpty && next === SELECT_EMPTY_SENTINEL) {
      onValueChange("");
      return;
    }
    onValueChange(next);
  };

  return (
    <Select value={radixValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger id={id} aria-labelledby={ariaLabelledBy} className={cn(triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {hasEmpty ? <SelectItem value={SELECT_EMPTY_SENTINEL}>{emptyOptionLabel}</SelectItem> : null}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
