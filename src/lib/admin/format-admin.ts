const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateShortFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
});

export function formatAdminPriceEUR(value: number | null): string {
  if (value == null) return "—";
  return priceFormatter.format(value);
}

export function formatAdminDateTime(value: Date): string {
  return dateFormatter.format(value);
}

/** Nur Datum (z. B. für Tabellen-Zweitzeile). */
export function formatAdminDateShort(value: Date): string {
  return dateShortFormatter.format(value);
}
