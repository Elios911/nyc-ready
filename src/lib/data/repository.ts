import type { BudgetItem, DayOfWeek, Profile, ScheduleBlock, Scenario } from "@/lib/domain/types";
import type { BudgetItemInput } from "@/lib/validation/budget";
import type { ProfileInput } from "@/lib/validation/profile";
import type { ScheduleBlockInput } from "@/lib/validation/schedule";

/** A schedule block to save for exactly one day (the `days` array is expanded by the caller). */
export type ScheduleBlockRecordInput = Omit<ScheduleBlockInput, "days"> & { dayOfWeek: DayOfWeek };

/**
 * Data access for ONE signed-in user (or one demo session).
 *
 * A repository instance is created per request by `getRepository()` and is
 * already scoped to the current user, so callers can never pass someone
 * else's user ID. Supabase implementations additionally rely on RLS.
 *
 * Methods that take an `id` must treat an ID belonging to another user (or a
 * missing one) as "not found" and throw `NotFoundError`.
 */
export interface PlanRepository {
  getProfile(): Promise<Profile>;
  updateProfile(input: ProfileInput, options?: { completeOnboarding?: boolean }): Promise<Profile>;

  /** The user's primary scenario. Every user has one (created at signup). */
  getPrimaryScenario(): Promise<Scenario>;

  listBudgetItems(scenarioId: string): Promise<BudgetItem[]>;
  createBudgetItem(scenarioId: string, input: BudgetItemInput): Promise<BudgetItem>;
  updateBudgetItem(id: string, input: BudgetItemInput): Promise<BudgetItem>;
  deleteBudgetItem(id: string): Promise<void>;

  listScheduleBlocks(scenarioId: string): Promise<ScheduleBlock[]>;
  createScheduleBlocks(scenarioId: string, inputs: ScheduleBlockRecordInput[]): Promise<ScheduleBlock[]>;
  updateScheduleBlock(id: string, input: ScheduleBlockRecordInput): Promise<ScheduleBlock>;
  deleteScheduleBlock(id: string): Promise<void>;
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

/** Expand a multi-day form submission into one record per day. */
export function expandScheduleInput(input: ScheduleBlockInput): ScheduleBlockRecordInput[] {
  const { days, ...rest } = input;
  return [...new Set(days)].sort().map((dayOfWeek) => ({ ...rest, dayOfWeek }));
}
