import { z } from "zod";
import { parseDollarsToCents } from "@/lib/finance/money";

/**
 * Reusable Zod field helpers. Form inputs are strings; schemas transform them
 * into domain values (integer cents, numbers, nulls). The same schemas run in
 * the browser (React Hook Form) and again on the server (Server Actions).
 */

/** $100M — generous upper bound that keeps cents comfortably within safe integers. */
export const MAX_CENTS = 100_000_000 * 100;
const MONEY_MESSAGE = "Enter a dollar amount, like 1250 or 1,250.50";

function toCents(value: string, ctx: z.RefinementCtx): number {
  const cents = parseDollarsToCents(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: MONEY_MESSAGE });
    return z.NEVER;
  }
  if (cents > MAX_CENTS) {
    ctx.addIssue({ code: "custom", message: "That amount is too large" });
    return z.NEVER;
  }
  return cents;
}

/** Optional dollar amount → integer cents or null. */
export const optionalMoney = z
  .string()
  .trim()
  .transform((value, ctx) => (value === "" ? null : toCents(value, ctx)));

/** Required dollar amount → integer cents. */
export const requiredMoney = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .transform((value, ctx) => toCents(value, ctx));

/** Optional free text → trimmed string or null. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === "" ? null : value));
}

/** Optional whole number in a range, entered as a string. */
export function optionalInt(min: number, max: number, label: string) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const number = Number(value);
      if (!Number.isInteger(number) || number < min || number > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number from ${min} to ${max}` });
        return z.NEVER;
      }
      return number;
    });
}

/** Optional calendar date (YYYY-MM-DD). */
export const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))), "Enter a valid date")
  .transform((value) => (value === "" ? null : value));

export const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:30");
