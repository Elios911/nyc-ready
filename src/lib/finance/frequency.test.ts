import { describe, expect, it } from "vitest";
import type { Frequency } from "@/lib/domain/types";
import { isFrequency, monthlyToWeeklyCents, toMonthlyCents } from "./frequency";

describe("toMonthlyCents", () => {
  it("converts weekly amounts with × 52 ÷ 12", () => {
    expect(toMonthlyCents(1200, "weekly")).toBe(5200); // $12/week → $52/month
    expect(toMonthlyCents(10000, "weekly")).toBe(43333); // $100/week → $433.33
  });
  it("keeps monthly amounts", () => {
    expect(toMonthlyCents(150000, "monthly")).toBe(150000);
  });
  it("divides yearly amounts by 12", () => {
    expect(toMonthlyCents(120000, "yearly")).toBe(10000);
    expect(toMonthlyCents(10000, "yearly")).toBe(833);
  });
  it("excludes one-time amounts from monthly totals", () => {
    expect(toMonthlyCents(300000, "one_time")).toBe(0);
  });
  it("rejects invalid input", () => {
    expect(() => toMonthlyCents(100, "daily" as Frequency)).toThrow(RangeError);
    expect(() => toMonthlyCents(Number.NaN, "monthly")).toThrow(RangeError);
  });
});

describe("monthlyToWeeklyCents", () => {
  it("converts monthly allowances to weekly with × 12 ÷ 52", () => {
    expect(monthlyToWeeklyCents(5200)).toBe(1200);
    expect(monthlyToWeeklyCents(40000)).toBe(9231);
  });
});

describe("isFrequency", () => {
  it("guards values", () => {
    expect(isFrequency("weekly")).toBe(true);
    expect(isFrequency("daily")).toBe(false);
    expect(isFrequency(undefined)).toBe(false);
  });
});
