import { describe, expect, it } from "vitest";
import type { ScheduleBlock } from "@/lib/domain/types";
import { blocksOverlap, durationMinutes, formatTime, sortBlocks, summarizeSchedule, timeToMinutes } from "./schedule";

function block(overrides: Partial<ScheduleBlock>): ScheduleBlock {
  return {
    id: crypto.randomUUID(),
    scenarioId: "s1",
    dayOfWeek: 1,
    title: "Block",
    activityType: "other",
    startTime: "09:00",
    endTime: "10:00",
    estimatedCostCents: 0,
    categoryId: null,
    location: null,
    notes: null,
    ...overrides,
  };
}

describe("time helpers", () => {
  it("parses and formats times", () => {
    expect(timeToMinutes("07:30")).toBe(450);
    expect(timeToMinutes("24:00")).toBeNaN();
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("18:30")).toBe("6:30 PM");
  });
  it("computes durations", () => {
    expect(durationMinutes({ startTime: "09:00", endTime: "17:30" })).toBe(510);
    expect(durationMinutes({ startTime: "10:00", endTime: "09:00" })).toBe(0);
  });
  it("sorts by day then start time", () => {
    const sorted = sortBlocks([
      block({ dayOfWeek: 2, startTime: "08:00" }),
      block({ dayOfWeek: 1, startTime: "18:00" }),
      block({ dayOfWeek: 1, startTime: "07:30" }),
    ]);
    expect(sorted.map((b) => `${b.dayOfWeek}-${b.startTime}`)).toEqual(["1-07:30", "1-18:00", "2-08:00"]);
  });
  it("detects overlaps on the same day only", () => {
    expect(blocksOverlap(block({ startTime: "09:00", endTime: "10:00" }), block({ startTime: "09:30", endTime: "11:00" }))).toBe(true);
    expect(blocksOverlap(block({ startTime: "09:00", endTime: "10:00" }), block({ startTime: "10:00", endTime: "11:00" }))).toBe(false);
    expect(blocksOverlap(block({ dayOfWeek: 1 }), block({ dayOfWeek: 2 }))).toBe(false);
  });
});

describe("summarizeSchedule", () => {
  it("totals spending per day, week and category", () => {
    const summary = summarizeSchedule([
      block({ dayOfWeek: 1, estimatedCostCents: 290, categoryId: "transportation.transit" }),
      block({ dayOfWeek: 1, estimatedCostCents: 290, categoryId: "transportation.transit" }),
      block({ dayOfWeek: 2, estimatedCostCents: 6000, categoryId: "groceries.produce" }),
      block({ dayOfWeek: 3, estimatedCostCents: 4500, categoryId: "lifestyle.restaurants" }),
      block({ dayOfWeek: 3, estimatedCostCents: 1000, categoryId: null }),
      block({ dayOfWeek: 4 }), // free activity
    ]);
    expect(summary.days[0]).toEqual({ dayOfWeek: 1, blockCount: 2, totalCents: 580 });
    expect(summary.days[3]?.blockCount).toBe(1);
    expect(summary.weeklyTotalCents).toBe(12080);
    expect(summary.monthlyEquivalentCents).toBe(Math.round((12080 * 52) / 12));
    expect(summary.weeklyByTopLevelCategory).toEqual({
      transportation: 580,
      groceries: 6000,
      lifestyle: 4500,
      other: 1000,
    });
  });
  it("handles an empty week", () => {
    const summary = summarizeSchedule([]);
    expect(summary.weeklyTotalCents).toBe(0);
    expect(summary.days).toHaveLength(7);
  });
  it("ignores negative costs", () => {
    expect(summarizeSchedule([block({ estimatedCostCents: -500 })]).weeklyTotalCents).toBe(0);
  });
});
