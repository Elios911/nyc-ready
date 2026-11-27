import { FREQUENCIES, type Cents, type Frequency } from "@/lib/domain/types";

/**
 * Frequency conversion — the documented, single way NYC Ready turns amounts
 * into comparable monthly and weekly figures.
 *
 *   weekly  → monthly: amount × 52 ÷ 12   (52 weeks spread over 12 months)
 *   yearly  → monthly: amount ÷ 12
 *   monthly → monthly: unchanged
 *   one-time → monthly: 0 (excluded from recurring totals; shown separately)
 *
 *   monthly → weekly:  amount × 12 ÷ 52
 *
 * Results are rounded to the nearest cent once per conversion.
 */

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

export function isFrequency(value: unknown): value is Frequency {
  return typeof value === "string" && (FREQUENCIES as readonly string[]).includes(value);
}

export function isRecurring(frequency: Frequency): boolean {
  return frequency !== "one_time";
}

/** Monthly equivalent in cents. One-time amounts return 0. Throws on an invalid frequency. */
export function toMonthlyCents(amountCents: Cents, frequency: Frequency): Cents {
  if (!Number.isFinite(amountCents)) throw new RangeError("Amount must be a finite number of cents");
  switch (frequency) {
    case "weekly":
      return Math.round((amountCents * WEEKS_PER_YEAR) / MONTHS_PER_YEAR);
    case "monthly":
      return Math.round(amountCents);
    case "yearly":
      return Math.round(amountCents / MONTHS_PER_YEAR);
    case "one_time":
      return 0;
    default: {
      const unknownFrequency: never = frequency;
      throw new RangeError(`Unknown frequency: ${String(unknownFrequency)}`);
    }
  }
}

/** Convert a weekly amount to its monthly equivalent. */
export function weeklyToMonthlyCents(weeklyCents: Cents): Cents {
  return toMonthlyCents(weeklyCents, "weekly");
}

/** Convert a monthly amount to a comparable weekly allowance. */
export function monthlyToWeeklyCents(monthlyCents: Cents): Cents {
  if (!Number.isFinite(monthlyCents)) throw new RangeError("Amount must be a finite number of cents");
  return Math.round((monthlyCents * MONTHS_PER_YEAR) / WEEKS_PER_YEAR);
}

export const FREQUENCY_EXPLANATIONS: Record<Frequency, string> = {
  weekly: "Weekly amount × 52 ÷ 12",
  monthly: "Counted as-is",
  yearly: "Yearly amount ÷ 12",
  one_time: "Not part of monthly totals; counted in move-in costs",
};
