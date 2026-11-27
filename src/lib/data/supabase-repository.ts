import "server-only";
import type {
  ActivityType,
  BudgetItem,
  BudgetItemType,
  DayOfWeek,
  Frequency,
  LifestylePreference,
  LivingArrangement,
  Profile,
  ScheduleBlock,
  Scenario,
} from "@/lib/domain/types";
import type { BudgetItemRow, ProfileRow, ScheduleBlockRow, ScenarioRow } from "@/lib/supabase/database.types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { BudgetItemInput } from "@/lib/validation/budget";
import type { ProfileInput } from "@/lib/validation/profile";
import { NotFoundError, type PlanRepository, type ScheduleBlockRecordInput } from "./repository";

// --- Row ⇄ domain mapping -----------------------------------------------------
// The database CHECK constraints guarantee the string unions below.

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    expectedMoveDate: row.expected_move_date,
    annualGrossIncomeCents: row.annual_gross_income_cents,
    monthlyTakeHomeIncomeCents: row.monthly_take_home_income_cents,
    currentSavingsCents: row.current_savings_cents,
    householdSize: row.household_size,
    livingArrangement: row.living_arrangement as LivingArrangement | null,
    preferredNeighborhoods: row.preferred_neighborhoods ?? [],
    workLocation: row.work_location,
    commuteDaysPerWeek: row.commute_days_per_week,
    lifestylePreferences: (row.lifestyle_preferences ?? []) as LifestylePreference[],
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

function toScenario(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    monthlyTakeHomeIncomeCents: row.monthly_take_home_income_cents,
    currentSavingsCents: row.current_savings_cents,
    isPrimary: row.is_primary,
  };
}

function toBudgetItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    categoryId: row.category_id,
    costItemId: row.cost_item_id,
    name: row.name,
    // bigint columns arrive as numbers; Number() guards against string serialisation.
    amountCents: Number(row.amount_cents),
    frequency: row.frequency as Frequency,
    itemType: row.item_type as BudgetItemType,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Postgres `time` comes back as "HH:MM:SS"; the app uses "HH:MM". */
const hhmm = (time: string) => time.slice(0, 5);

function toScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    dayOfWeek: row.day_of_week as DayOfWeek,
    title: row.title,
    activityType: row.activity_type as ActivityType,
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    estimatedCostCents: Number(row.estimated_cost_cents),
    categoryId: row.category_id,
    location: row.location,
    notes: row.notes,
  };
}

function budgetItemColumns(input: BudgetItemInput) {
  return {
    category_id: input.categoryId,
    cost_item_id: input.costItemId,
    name: input.name,
    amount_cents: input.amount,
    frequency: input.frequency,
    item_type: input.itemType,
    notes: input.notes,
  };
}

function blockColumns(input: ScheduleBlockRecordInput) {
  return {
    day_of_week: input.dayOfWeek,
    title: input.title,
    activity_type: input.activityType,
    start_time: input.startTime,
    end_time: input.endTime,
    estimated_cost_cents: input.estimatedCost,
    category_id: input.categoryId,
    location: input.location,
    notes: input.notes,
  };
}

function fail(error: { message: string } | null, context: string): never {
  // Log details server-side; surface a generic message to the UI.
  console.error(`[supabase] ${context}:`, error?.message);
  throw new Error(`Could not ${context}. Please try again.`);
}

/** Catalog cost item IDs are UUIDs in Supabase; anything else (e.g. a demo slug) is dropped. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Supabase-backed repository. Every query is filtered by the signed-in user's
 * ID *and* protected by Row Level Security (defence in depth).
 */
export class SupabaseRepository implements PlanRepository {
  constructor(
    private readonly supabase: SupabaseServerClient,
    private readonly userId: string,
  ) {}

  async getProfile() {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", this.userId).maybeSingle();
    if (error) fail(error, "load your profile");
    if (data) return toProfile(data);
    // The signup trigger normally creates this row; create it if it is missing.
    const inserted = await this.supabase.from("profiles").insert({ id: this.userId }).select("*").single();
    if (inserted.error) fail(inserted.error, "create your profile");
    return toProfile(inserted.data);
  }

  async updateProfile(input: ProfileInput, options: { completeOnboarding?: boolean } = {}) {
    const current = await this.getProfile();
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        full_name: input.fullName,
        expected_move_date: input.expectedMoveDate,
        annual_gross_income_cents: input.annualGrossIncome,
        monthly_take_home_income_cents: input.monthlyTakeHomeIncome,
        current_savings_cents: input.currentSavings,
        household_size: input.householdSize,
        living_arrangement: input.livingArrangement,
        preferred_neighborhoods: input.preferredNeighborhoods,
        work_location: input.workLocation,
        commute_days_per_week: input.commuteDaysPerWeek,
        lifestyle_preferences: input.lifestylePreferences,
        onboarding_completed_at:
          options.completeOnboarding && !current.onboardingCompletedAt ? new Date().toISOString() : current.onboardingCompletedAt,
      })
      .eq("id", this.userId)
      .select("*")
      .single();
    if (error) fail(error, "save your profile");
    return toProfile(data);
  }

  async getPrimaryScenario() {
    const { data, error } = await this.supabase
      .from("scenarios")
      .select("*")
      .eq("user_id", this.userId)
      .eq("is_primary", true)
      .maybeSingle();
    if (error) fail(error, "load your plan");
    if (data) return toScenario(data);
    const inserted = await this.supabase
      .from("scenarios")
      .insert({ user_id: this.userId, name: "My NYC plan", is_primary: true })
      .select("*")
      .single();
    if (inserted.error) fail(inserted.error, "create your plan");
    return toScenario(inserted.data);
  }

  async listBudgetItems(scenarioId: string) {
    const { data, error } = await this.supabase
      .from("budget_items")
      .select("*")
      .eq("user_id", this.userId)
      .eq("scenario_id", scenarioId)
      .order("created_at", { ascending: true });
    if (error) fail(error, "load your budget");
    return data.map(toBudgetItem);
  }

  async createBudgetItem(scenarioId: string, input: BudgetItemInput) {
    const columns = budgetItemColumns(input);
    const { data, error } = await this.supabase
      .from("budget_items")
      .insert({
        ...columns,
        cost_item_id: columns.cost_item_id && UUID_PATTERN.test(columns.cost_item_id) ? columns.cost_item_id : null,
        scenario_id: scenarioId,
        user_id: this.userId,
      })
      .select("*")
      .single();
    if (error) fail(error, "add this budget item");
    return toBudgetItem(data);
  }

  async updateBudgetItem(id: string, input: BudgetItemInput) {
    const columns = budgetItemColumns(input);
    const { data, error } = await this.supabase
      .from("budget_items")
      .update({ ...columns, cost_item_id: columns.cost_item_id && UUID_PATTERN.test(columns.cost_item_id) ? columns.cost_item_id : null })
      .eq("id", id)
      .eq("user_id", this.userId)
      .select("*")
      .maybeSingle();
    if (error) fail(error, "update this budget item");
    if (!data) throw new NotFoundError("Budget item");
    return toBudgetItem(data);
  }

  async deleteBudgetItem(id: string) {
    const { data, error } = await this.supabase.from("budget_items").delete().eq("id", id).eq("user_id", this.userId).select("id");
    if (error) fail(error, "delete this budget item");
    if (!data.length) throw new NotFoundError("Budget item");
  }

  async listScheduleBlocks(scenarioId: string) {
    const { data, error } = await this.supabase
      .from("weekly_schedule_blocks")
      .select("*")
      .eq("user_id", this.userId)
      .eq("scenario_id", scenarioId)
      .order("day_of_week")
      .order("start_time");
    if (error) fail(error, "load your weekly plan");
    return data.map(toScheduleBlock);
  }

  async createScheduleBlocks(scenarioId: string, inputs: ScheduleBlockRecordInput[]) {
    if (inputs.length === 0) return [];
    const { data, error } = await this.supabase
      .from("weekly_schedule_blocks")
      .insert(inputs.map((input) => ({ ...blockColumns(input), scenario_id: scenarioId, user_id: this.userId })))
      .select("*");
    if (error) fail(error, "add this activity");
    return data.map(toScheduleBlock);
  }

  async updateScheduleBlock(id: string, input: ScheduleBlockRecordInput) {
    const { data, error } = await this.supabase
      .from("weekly_schedule_blocks")
      .update(blockColumns(input))
      .eq("id", id)
      .eq("user_id", this.userId)
      .select("*")
      .maybeSingle();
    if (error) fail(error, "update this activity");
    if (!data) throw new NotFoundError("Schedule block");
    return toScheduleBlock(data);
  }

  async deleteScheduleBlock(id: string) {
    const { data, error } = await this.supabase
      .from("weekly_schedule_blocks")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId)
      .select("id");
    if (error) fail(error, "delete this activity");
    if (!data.length) throw new NotFoundError("Schedule block");
  }
}
