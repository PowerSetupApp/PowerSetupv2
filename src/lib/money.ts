/**
 * Money helper — Prisma gibt `Decimal`-Felder als `Decimal.js`-Instanz zurück,
 * Client-DTOs verwenden jedoch `number` (UI, JSON-API). Konvertierung findet an
 * der Query-Grenze statt, damit App-Code einheitlich mit `number` arbeitet.
 *
 * Präzisionsverlust ist für 2 Nachkommastellen (EUR-Preise, Kauf-Beträge)
 * unkritisch; für 6-stellige Token-Preise reicht `number` bis ~15 signifikante
 * Stellen (IEEE-754) ebenfalls aus.
 */

type DecimalLike = { toNumber(): number } | number | null | undefined;

export function decimalToNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = value.toNumber();
  return Number.isFinite(n) ? n : null;
}

/** Für Felder mit Default (z. B. ModelPricing.inputPrice): immer `number`. */
export function decimalToNumberOrZero(value: DecimalLike): number {
  return decimalToNumber(value) ?? 0;
}
