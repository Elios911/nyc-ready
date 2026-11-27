import { topLevelCategoryId } from "@/lib/domain/categories";
import { DAYS_OF_WEEK, type Cents, type DayOfWeek, type ScheduleBlock } from "@/lib/domain/types";
import { weeklyToMonthlyCents } from "./frequency";

/** Minutes since midnight for an "HH:MM" string. Returns NaN if invalid. */
export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** "18:30" → "6:30 PM". Returns the input unchanged if it is not a valid time. */
export function formatTime(time: string): string {
  const minutes = timeToMinutes(time);
  if (Number.isNaN(minutes)) return time;
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function durationMinutes(block: Pick<ScheduleBlock, "startTime" | "endTime">): number {
  const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

export function sortBlocks<T extends Pick<ScheduleBlock, "dayOfWeek" | "startTime">>(blocks: readonly T[]): T[] {
  return [...blocks].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
}

export interface DaySummary {
  dayOfWeek: DayOfWeek;
  blockCount: number;
  totalCents: Cents;
}

export interface WeeklyScheduleSummary {
  days: DaySummary[];
  weeklyTotalCents: Cents;
  /** Weekly total converted with the standard × 52 ÷ 12 rule. */
  monthlyEquivalentCents: Cents;
  /** Weekly planned spending per top-level category ID (blocks without a category count as "other"). */
  weeklyByTopLevelCategory: Record<string, Cents>;
}

export function summarizeSchedule(blocks: readonly ScheduleBlock[]): WeeklyScheduleSummary {
  const days: DaySummary[] = DAYS_OF_WEEK.map((dayOfWeek) => ({ dayOfWeek, blockCount: 0, totalCents: 0 }));
  const weeklyByTopLevelCategory: Record<string, Cents> = {};
  let weeklyTotalCents = 0;

  for (const block of blocks) {
    const day = days[block.dayOfWeek - 1];
    if (!day) continue; // ignore invalid days defensively
    const cost = Math.max(0, Math.round(block.estimatedCostCents));
    day.blockCount += 1;
    day.totalCents += cost;
    weeklyTotalCents += cost;
    if (cost > 0) {
      const group = block.categoryId ? topLevelCategoryId(block.categoryId) : "other";
      weeklyByTopLevelCategory[group] = (weeklyByTopLevelCategory[group] ?? 0) + cost;
    }
  }

  return {
    days,
    weeklyTotalCents,
    monthlyEquivalentCents: weeklyToMonthlyCents(weeklyTotalCents),
    weeklyByTopLevelCategory,
  };
}

/** Do two blocks on the same day overlap in time? Touching edges (9–10 and 10–11) do not overlap. */
export function blocksOverlap(
  a: Pick<ScheduleBlock, "dayOfWeek" | "startTime" | "endTime">,
  b: Pick<ScheduleBlock, "dayOfWeek" | "startTime" | "endTime">,
): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(b.startTime) < timeToMinutes(a.endTime);
}
