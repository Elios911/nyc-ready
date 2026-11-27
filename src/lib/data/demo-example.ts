import type { BudgetItem, BudgetItemType, DayOfWeek, Frequency, Profile, ScheduleBlock, ActivityType } from "@/lib/domain/types";

/**
 * ⚠️ DEMONSTRATION DATA — an example plan for an imaginary recent graduate.
 * Amounts are illustrative round numbers, not estimates of real NYC costs.
 * The scenario is named "Example plan (demo data)" and the UI shows a demo
 * banner on every page, so none of this can be mistaken for real figures.
 */

const NOTE = "Example item (demo data)";

type ItemSeed = [name: string, itemType: BudgetItemType, categoryId: string, dollars: number, frequency: Frequency, costItemId?: string];

const ITEMS: ItemSeed[] = [
  ["Room in shared apartment", "fixed", "housing.rent", 1400, "monthly", "room-in-shared-apartment"],
  ["Electricity & gas (my share)", "fixed", "housing.utilities", 60, "monthly"],
  ["Home internet (my share)", "fixed", "housing.internet_phone", 30, "monthly"],
  ["Phone plan", "fixed", "housing.internet_phone", 40, "monthly", "mobile-phone-plan"],
  ["Budget gym membership", "fixed", "fitness.gym", 25, "monthly", "budget-gym-membership"],
  ["Monthly transit pass", "fixed", "transportation.transit", 135, "monthly", "monthly-transit-pass"],
  ["Streaming subscription", "fixed", "subscriptions", 15, "monthly", "streaming-subscription"],
  ["Renters insurance", "fixed", "health.insurance", 15, "monthly", "renters-insurance"],
  ["Groceries", "variable", "groceries", 90, "weekly"],
  ["Eating out & coffee", "variable", "lifestyle", 250, "monthly"],
  ["Clothing & personal care", "variable", "personal", 80, "monthly"],
  ["Household supplies & laundry", "variable", "housing.household", 40, "monthly"],
  ["Emergency fund", "savings", "savings.emergency", 300, "monthly"],
  ["Security deposit", "relocation", "relocation.deposit", 1400, "one_time"],
  ["First month's rent", "relocation", "relocation.first_rent", 1400, "one_time"],
  ["Movers & travel", "relocation", "relocation.moving", 600, "one_time"],
  ["Bed, desk & essentials", "relocation", "relocation.furniture", 800, "one_time"],
];

type BlockSeed = [days: DayOfWeek[], title: string, activityType: ActivityType, start: string, end: string, dollars: number, categoryId: string | null];

const WEEKDAYS: DayOfWeek[] = [1, 2, 3, 4, 5];

const BLOCKS: BlockSeed[] = [
  [WEEKDAYS, "Commute to work", "commute", "07:30", "08:15", 0, "transportation.transit"],
  [WEEKDAYS, "Work", "work", "09:00", "17:30", 0, null],
  [WEEKDAYS, "Commute home", "commute", "17:30", "18:15", 0, "transportation.transit"],
  [[1, 3, 5], "Gym", "fitness", "18:30", "19:30", 0, "fitness.gym"],
  [[1, 4], "Cook dinner", "cooking", "20:00", "21:00", 0, null],
  [[2], "Grocery shopping", "groceries", "18:30", "19:30", 75, "groceries"],
  [[3], "Dinner with friends", "social", "20:00", "22:00", 35, "lifestyle.restaurants"],
  [[5], "Drinks after work", "social", "19:00", "21:00", 25, "lifestyle.bars_social"],
  [[6], "Brunch", "dining_out", "11:00", "12:30", 30, "lifestyle.restaurants"],
  [[6], "Museum or park day", "entertainment", "14:00", "17:00", 0, null],
  [[7], "Laundry", "personal", "10:00", "11:30", 6, "housing.laundry"],
  [[7], "Meal prep", "cooking", "16:00", "18:00", 0, null],
];

export function buildExamplePlan(sessionId: string, scenarioId: string, blankProfile: Profile) {
  const createdAt = new Date().toISOString();
  const profile: Profile = {
    ...blankProfile,
    id: sessionId,
    fullName: "Demo user",
    expectedMoveDate: null,
    annualGrossIncomeCents: 6_500_000,
    monthlyTakeHomeIncomeCents: 420_000,
    currentSavingsCents: 900_000,
    householdSize: 3,
    livingArrangement: "roommates",
    preferredNeighborhoods: ["Astoria", "Bushwick"],
    workLocation: "Midtown Manhattan",
    commuteDaysPerWeek: 5,
    lifestylePreferences: ["cooks_at_home", "fitness_focused", "social_nightlife"],
    onboardingCompletedAt: createdAt,
  };

  const budgetItems: BudgetItem[] = ITEMS.map(([name, itemType, categoryId, dollars, frequency, costItemId], index) => ({
    id: `demo-item-${index}`,
    scenarioId,
    categoryId,
    costItemId: costItemId ?? null,
    name,
    amountCents: dollars * 100,
    frequency,
    itemType,
    notes: NOTE,
    createdAt,
  }));

  let blockIndex = 0;
  const scheduleBlocks: ScheduleBlock[] = BLOCKS.flatMap(([days, title, activityType, startTime, endTime, dollars, categoryId]) =>
    days.map((dayOfWeek) => ({
      id: `demo-block-${blockIndex++}`,
      scenarioId,
      dayOfWeek,
      title,
      activityType,
      startTime,
      endTime,
      estimatedCostCents: dollars * 100,
      categoryId,
      location: null,
      notes: null,
    })),
  );

  return { profile, budgetItems, scheduleBlocks };
}
