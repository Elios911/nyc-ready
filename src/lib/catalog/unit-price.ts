import type { Cents } from "@/lib/domain/types";

/**
 * Unit pricing, e.g. "$4.99 for a half gallon" → "$9.98 / gallon".
 * Returns null when there is no meaningful quantity.
 */
export function unitPriceCents(priceCents: Cents, quantity: number | null | undefined): number | null {
  if (quantity === null || quantity === undefined || !Number.isFinite(quantity) || quantity <= 0) return null;
  return priceCents / quantity; // fractional cents are fine here; round only when displaying
}

/** Units where "per unit" is the natural way to read the price (no unit price shown). */
const SINGLE_UNITS = new Set(["each", "month", "ride", "visit", "class", "service", "week", "year", "ticket", "load"]);

export function shouldShowUnitPrice(unit: string, quantity: number | null | undefined): boolean {
  if (quantity === null || quantity === undefined) return false;
  return !(SINGLE_UNITS.has(unit) && quantity === 1);
}

/** Human-readable package description: (0.5, "gallon") → "0.5 gallon". */
export function describeQuantity(quantity: number | null | undefined, unit: string): string | null {
  if (quantity === null || quantity === undefined) return null;
  const rounded = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(3)));
  return `${rounded} ${unit}`;
}
