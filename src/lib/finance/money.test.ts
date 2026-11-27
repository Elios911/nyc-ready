import { describe, expect, it } from "vitest";
import { centsToInputValue, formatCents, formatCentsCompact, formatPercent, parseDollarsToCents, percentOf } from "./money";

describe("formatCents", () => {
  it("formats cents as dollars", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(-2500)).toBe("-$25.00");
  });
  it("can round to whole dollars", () => {
    expect(formatCents(123456, { showCents: false })).toBe("$1,235");
  });
  it("uses a fallback for missing values", () => {
    expect(formatCents(null)).toBe("—");
    expect(formatCents(undefined, { fallback: "n/a" })).toBe("n/a");
    expect(formatCents(Number.NaN)).toBe("—");
  });
  it("compact format hides zero cents", () => {
    expect(formatCentsCompact(120000)).toBe("$1,200");
    expect(formatCentsCompact(1250)).toBe("$12.50");
  });
});

describe("parseDollarsToCents", () => {
  it.each([
    ["1234", 123400],
    ["1,234.56", 123456],
    ["$12.99", 1299],
    ["12.5", 1250],
    [".50", 50],
    ["0", 0],
    [" 45 ", 4500],
  ])("parses %s", (input, expected) => {
    expect(parseDollarsToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1,23", "12..3", "$"])("rejects %s", (input) => {
    expect(parseDollarsToCents(input)).toBeNull();
  });

  it("avoids floating point errors", () => {
    // 0.1 + 0.2 style issues would show up as 1.0049999 → 100 or 101
    expect(parseDollarsToCents("1.005".slice(0, 4))).toBe(100);
    expect(parseDollarsToCents("19.99")).toBe(1999);
    expect(parseDollarsToCents("4.35")).toBe(435);
  });
});

describe("centsToInputValue", () => {
  it("round-trips with parseDollarsToCents", () => {
    for (const cents of [0, 5, 99, 100, 1999, 123456]) {
      expect(parseDollarsToCents(centsToInputValue(cents))).toBe(cents);
    }
  });
  it("returns an empty string for null", () => {
    expect(centsToInputValue(null)).toBe("");
  });
});

describe("percentOf", () => {
  it("handles zero and missing income", () => {
    expect(percentOf(100, 0)).toBeNull();
    expect(percentOf(100, -5)).toBeNull();
    expect(percentOf(50, 200)).toBe(25);
  });
  it("formats percentages", () => {
    expect(formatPercent(25)).toBe("25%");
    expect(formatPercent(4.25)).toBe("4.3%");
    expect(formatPercent(null)).toBe("—");
  });
});
