/**
 * Domain types shared by the UI, business logic and data layer.
 *
 * Conventions:
 * - Money is ALWAYS an integer number of US cents (`Cents`). Never store or add
 *   dollar floats. Format with `formatCents` from `@/lib/finance/money`.
 * - Days of the week use ISO numbering: 1 = Monday … 7 = Sunday.
 * - Times are "HH:MM" 24-hour strings.
 * - IDs are opaque strings. In Supabase mode they are UUIDs; in demo mode some
 *   catalog IDs are slugs. Code must not depend on their format.
 */

/** Integer number of US cents. */
export type Cents = number;

export const FREQUENCIES = ["weekly", "monthly", "yearly", "one_time"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  one_time: "One-time",
};

/** "per …" wording: $20 / week. */
export const FREQUENCY_UNIT: Record<Frequency, string> = {
  weekly: "week",
  monthly: "month",
  yearly: "year",
  one_time: "one-time",
};

/**
 * What a budget line represents.
 * - income: money coming in on top of take-home pay (side job, stipend…)
 * - fixed: recurring bills with a set amount (rent, phone, gym membership)
 * - variable: an *allowance* for spending that varies (groceries, dining out)
 * - savings: a planned recurring contribution (emergency fund…)
 * - relocation: a one-time move-in cost (deposit, movers, furniture)
 */
export const BUDGET_ITEM_TYPES = [
  "income",
  "fixed",
  "variable",
  "savings",
  "relocation",
] as const;
export type BudgetItemType = (typeof BUDGET_ITEM_TYPES)[number];

export const BUDGET_ITEM_TYPE_LABELS: Record<BudgetItemType, string> = {
  income: "Additional income",
  fixed: "Fixed expense",
  variable: "Variable allowance",
  savings: "Savings contribution",
  relocation: "One-time relocation cost",
};

export const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayOfWeek, { short: string; long: string }> = {
  1: { short: "Mon", long: "Monday" },
  2: { short: "Tue", long: "Tuesday" },
  3: { short: "Wed", long: "Wednesday" },
  4: { short: "Thu", long: "Thursday" },
  5: { short: "Fri", long: "Friday" },
  6: { short: "Sat", long: "Saturday" },
  7: { short: "Sun", long: "Sunday" },
};

export const ACTIVITY_TYPES = [
  "work",
  "commute",
  "groceries",
  "cooking",
  "dining_out",
  "fitness",
  "social",
  "shopping",
  "entertainment",
  "personal",
  "other",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  work: "Work",
  commute: "Commute",
  groceries: "Grocery shopping",
  cooking: "Cooking",
  dining_out: "Eating out",
  fitness: "Gym & fitness",
  social: "Meeting friends",
  shopping: "Shopping",
  entertainment: "Entertainment",
  personal: "Personal",
  other: "Other",
};

export const LIVING_ARRANGEMENTS = ["alone", "roommates", "partner", "undecided"] as const;
export type LivingArrangement = (typeof LIVING_ARRANGEMENTS)[number];

export const LIVING_ARRANGEMENT_LABELS: Record<LivingArrangement, string> = {
  alone: "Living alone",
  roommates: "With roommates",
  partner: "With a partner",
  undecided: "Not sure yet",
};

export const LIFESTYLE_PREFERENCES = [
  "cooks_at_home",
  "eats_out_often",
  "fitness_focused",
  "social_nightlife",
  "arts_culture",
  "saving_focused",
] as const;
export type LifestylePreference = (typeof LIFESTYLE_PREFERENCES)[number];

export const LIFESTYLE_LABELS: Record<LifestylePreference, string> = {
  cooks_at_home: "Mostly cooks at home",
  eats_out_often: "Eats out often",
  fitness_focused: "Fitness is a priority",
  social_nightlife: "Goes out with friends",
  arts_culture: "Museums, shows & events",
  saving_focused: "Saving aggressively",
};

export interface Profile {
  id: string;
  fullName: string | null;
  expectedMoveDate: string | null; // YYYY-MM-DD
  annualGrossIncomeCents: Cents | null;
  monthlyTakeHomeIncomeCents: Cents | null;
  currentSavingsCents: Cents | null;
  householdSize: number | null;
  livingArrangement: LivingArrangement | null;
  preferredNeighborhoods: string[];
  workLocation: string | null;
  commuteDaysPerWeek: number | null;
  lifestylePreferences: LifestylePreference[];
  onboardingCompletedAt: string | null;
}

/**
 * A scenario is one possible version of the user's NYC life ("With roommates
 * in Astoria", "Living alone"). Budget items and schedule blocks belong to a
 * scenario. Income/savings left null inherit the profile's values.
 */
export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  monthlyTakeHomeIncomeCents: Cents | null;
  currentSavingsCents: Cents | null;
  isPrimary: boolean;
}

export interface BudgetItem {
  id: string;
  scenarioId: string;
  categoryId: string;
  costItemId: string | null;
  name: string;
  amountCents: Cents;
  frequency: Frequency;
  itemType: BudgetItemType;
  notes: string | null;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  scenarioId: string;
  dayOfWeek: DayOfWeek;
  title: string;
  activityType: ActivityType;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  estimatedCostCents: Cents;
  categoryId: string | null;
  location: string | null;
  notes: string | null;
}
