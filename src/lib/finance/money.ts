import type { Cents } from "@/lib/domain/types";

/**
 * Money helpers. All amounts are integer cents; these functions are the only
 * place that converts between cents and human-readable dollars.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(showCents: boolean): Intl.NumberFormat {
  const key = showCents ? "cents" : "whole";
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export interface FormatCentsOptions {
  /** Show cents (default true). When false, rounds to whole dollars. */
  showCents?: boolean;
  /** Text to show when the amount is missing (default "—"). */
  fallback?: string;
}

/** Format integer cents as US dollars: 123456 → "$1,234.56". */
export function formatCents(cents: Cents | null | undefined, options: FormatCentsOptions = {}): string {
  const { showCents = true, fallback = "—" } = options;
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return fallback;
  const dollars = showCents ? cents / 100 : Math.round(cents / 100);
  return getFormatter(showCents).format(dollars);
}

/** Format cents with cents only when they are non-zero: 120000 → "$1,200", 1250 → "$12.50". */
export function formatCentsCompact(cents: Cents | null | undefined, fallback = "—"): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return fallback;
  return formatCents(cents, { showCents: cents % 100 !== 0, fallback });
}

const DOLLAR_PATTERN = /^\$?\s*(\d{1,3}(,\d{3})+|\d+)?(\.\d{0,2})?$/;

/**
 * Parse a user-entered dollar string into integer cents without floating-point
 * maths. Accepts "1234", "1,234.5", "$12.99", ".50". Returns null if invalid
 * or negative.
 */
export function parseDollarsToCents(input: string | null | undefined): Cents | null {
  if (input === null || input === undefined) return null;
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "$" || trimmed === ".") return null;
  if (!DOLLAR_PATTERN.test(trimmed)) return null;

  const normalized = trimmed.replace(/[$,\s]/g, "");
  const [wholePart = "", fractionPart = ""] = normalized.split(".");
  const whole = wholePart === "" ? 0 : Number.parseInt(wholePart, 10);
  const fraction = Number.parseInt(fractionPart.padEnd(2, "0") || "0", 10);
  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Convert cents to a plain dollar string for form inputs: 123450 → "1234.50", 120000 → "1200". */
export function centsToInputValue(cents: Cents | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100);
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

/** Sum a list of cent amounts. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}

/** Percentage helper that returns null instead of dividing by zero. */
export function percentOf(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
  return (part / whole) * 100;
}

export function formatPercent(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return `${value.toFixed(value >= 10 || value === 0 ? 0 : 1)}%`;
}
