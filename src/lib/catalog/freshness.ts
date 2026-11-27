import type { ConfidenceLevel, DataSource, PriceObservation, PriceType } from "./types";

/**
 * Freshness and reliability labels. Every price shown in the UI goes through
 * `describePrice()` so the label rules live in one tested place.
 */

/** Used when a source does not declare its own refresh interval. */
export const DEFAULT_FRESH_DAYS = 90;

export type FreshnessStatus =
  | "demo" // illustrative bundled data
  | "user_submitted" // unverified report
  | "estimate" // provider estimate / average
  | "recent" // verified observation within the source's refresh window
  | "stale" // verified observation older than the window
  | "expired"; // past its explicit expiry date

export interface PriceDescription {
  status: FreshnessStatus;
  label: string;
  /** One-sentence explanation suitable for a tooltip. */
  explanation: string;
  ageDays: number;
  confidence: ConfidenceLevel;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function ageInDays(isoDate: string, now: Date = new Date()): number {
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
}

const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  verified_observation: "Observed price",
  provider_estimate: "Provider estimate",
  user_submitted: "User-submitted",
  demo: "Demo data",
};

export function priceTypeLabel(priceType: PriceType): string {
  return PRICE_TYPE_LABELS[priceType];
}

export function describePrice(
  observation: Pick<PriceObservation, "priceType" | "observedAt" | "verifiedAt" | "expiresAt" | "isDemo" | "confidenceLevel">,
  source: Pick<DataSource, "refreshIntervalDays" | "sourceType">,
  now: Date = new Date(),
): PriceDescription {
  const referenceDate = observation.verifiedAt ?? observation.observedAt;
  const ageDays = ageInDays(referenceDate, now);
  const confidence = observation.confidenceLevel;

  // Demo data is always labelled as such, whatever else is set on the record.
  if (observation.isDemo || observation.priceType === "demo" || source.sourceType === "demo") {
    return {
      status: "demo",
      label: "Demo data",
      explanation: "Illustrative value for exploring the app. Not a real or current price.",
      ageDays,
      confidence: "low",
    };
  }

  if (observation.expiresAt && Date.parse(observation.expiresAt) < now.getTime()) {
    return {
      status: "expired",
      label: "Expired",
      explanation: "This price is past the date its source said it was valid until.",
      ageDays,
      confidence: "low",
    };
  }

  if (observation.priceType === "user_submitted") {
    return {
      status: "user_submitted",
      label: "User-submitted",
      explanation: "Reported by an NYC Ready user and not independently verified.",
      ageDays,
      confidence,
    };
  }

  if (observation.priceType === "provider_estimate") {
    return {
      status: "estimate",
      label: "Estimate",
      explanation: "A typical or starting price published by the provider, not a specific observed price.",
      ageDays,
      confidence,
    };
  }

  const window = source.refreshIntervalDays ?? DEFAULT_FRESH_DAYS;
  if (ageDays <= window) {
    return {
      status: "recent",
      label: "Recently verified",
      explanation: `Observed or verified ${formatAge(ageDays)}, within this source's ${window}-day refresh window.`,
      ageDays,
      confidence,
    };
  }
  return {
    status: "stale",
    label: "Older observation",
    explanation: `Last observed ${formatAge(ageDays)}. Prices may have changed since.`,
    ageDays,
    confidence: confidence === "high" ? "medium" : "low",
  };
}

export function formatAge(ageDays: number): string {
  if (!Number.isFinite(ageDays)) return "at an unknown date";
  if (ageDays === 0) return "today";
  if (ageDays === 1) return "yesterday";
  if (ageDays < 60) return `${ageDays} days ago`;
  const months = Math.round(ageDays / 30);
  if (months < 24) return `about ${months} months ago`;
  return `about ${Math.round(ageDays / 365)} years ago`;
}
