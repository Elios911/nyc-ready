import { describe, expect, it } from "vitest";
import { ageInDays, describePrice, formatAge } from "./freshness";

const now = new Date("2026-11-27T12:00:00Z");
const base = {
  priceType: "verified_observation" as const,
  observedAt: "2026-11-20T12:00:00Z",
  verifiedAt: null,
  expiresAt: null,
  isDemo: false,
  confidenceLevel: "high" as const,
};
const official = { refreshIntervalDays: 30, sourceType: "official" as const };

describe("describePrice", () => {
  it("always labels demo data as demo, even if other fields look real", () => {
    expect(describePrice({ ...base, isDemo: true }, official, now).status).toBe("demo");
    expect(describePrice(base, { ...official, sourceType: "demo" }, now).status).toBe("demo");
    expect(describePrice({ ...base, isDemo: true }, official, now).confidence).toBe("low");
  });

  it("distinguishes recent and older verified observations using the source window", () => {
    expect(describePrice(base, official, now).status).toBe("recent");
    expect(describePrice({ ...base, observedAt: "2026-09-01T00:00:00Z" }, official, now).status).toBe("stale");
    // verified_at takes precedence over observed_at
    expect(describePrice({ ...base, observedAt: "2025-01-01T00:00:00Z", verifiedAt: "2026-11-25T00:00:00Z" }, official, now).status).toBe("recent");
  });

  it("falls back to the default window when a source has none", () => {
    const old = { ...base, observedAt: "2026-07-01T00:00:00Z" }; // ~149 days
    expect(describePrice(old, { refreshIntervalDays: null, sourceType: "curated_manual" }, now).status).toBe("stale");
  });

  it("labels estimates, user submissions and expired prices", () => {
    expect(describePrice({ ...base, priceType: "provider_estimate" }, official, now).status).toBe("estimate");
    expect(describePrice({ ...base, priceType: "user_submitted" }, official, now).status).toBe("user_submitted");
    expect(describePrice({ ...base, expiresAt: "2026-11-01T00:00:00Z" }, official, now).status).toBe("expired");
  });

  it("downgrades confidence for stale observations", () => {
    expect(describePrice({ ...base, observedAt: "2025-01-01T00:00:00Z" }, official, now).confidence).toBe("medium");
  });
});

describe("age helpers", () => {
  it("computes and formats ages", () => {
    expect(ageInDays("2026-11-26T12:00:00Z", now)).toBe(1);
    expect(ageInDays("not a date", now)).toBe(Number.POSITIVE_INFINITY);
    expect(formatAge(0)).toBe("today");
    expect(formatAge(1)).toBe("yesterday");
    expect(formatAge(10)).toBe("10 days ago");
    expect(formatAge(120)).toBe("about 4 months ago");
    expect(formatAge(Number.POSITIVE_INFINITY)).toBe("at an unknown date");
  });
});
