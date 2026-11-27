import { topLevelCategoryId } from "@/lib/domain/categories";
import type { BudgetItem, Cents, ScheduleBlock } from "@/lib/domain/types";
import { toMonthlyCents, weeklyToMonthlyCents } from "./frequency";
import { percentOf } from "./money";
import { summarizeSchedule, type WeeklyScheduleSummary } from "./schedule";

/**
 * The NYC Ready accounting model. Everything the dashboard and budget pages
 * show is computed here, from stored data, so it can be unit tested.
 *
 * MONTHLY INCOME
 *   take-home pay (scenario, else profile) + recurring "income" items
 *
 * MONTHLY EXPENSES
 *   fixed expenses
 *   + variable allowances
 *   + planned spending from the weekly planner that is NOT covered by an
 *     allowance (see "avoiding double counting" below)
 *
 * SAVINGS (never counted as an expense)
 *   planned savings  = recurring "savings" items
 *   unallocated      = income − expenses − planned savings
 *   total saved/mo   = planned savings + max(unallocated, 0)
 *
 * AVOIDING DOUBLE COUNTING
 *   A variable budget item is an *allowance* ("$400/month for groceries").
 *   A weekly planner activity with a cost is a *planned expense* ("$60 grocery
 *   run on Tuesday"). Per top-level category, the planner's monthly equivalent
 *   is compared with the variable allowance:
 *     - planned ≤ allowance → already covered, nothing extra is counted
 *     - planned > allowance → only the excess is added to expenses
 *     - no allowance        → all planned spending is added
 *   Fixed expenses are never offset: a $20 class fee in the planner is extra
 *   spending on top of a gym membership.
 *
 * ONE-TIME RELOCATION COSTS
 *   Excluded from monthly totals. Position before moving =
 *   current savings − one-time relocation costs.
 */

/** Unallocated money below this share of income is flagged as a thin margin. */
export const THIN_MARGIN_RATIO = 0.05;

export type PlanStatus = "missing_income" | "shortfall" | "thin_margin" | "balanced";

export interface CategoryReconciliation {
  categoryId: string; // top-level category
  fixedMonthlyCents: Cents;
  allowanceMonthlyCents: Cents;
  plannedMonthlyCents: Cents;
  /** Planned spending not covered by the allowance (added to expenses). */
  uncoveredPlannedMonthlyCents: Cents;
  /** What this category contributes to total monthly expenses. */
  countedMonthlyCents: Cents;
}

export interface PlanSummaryInput {
  takeHomeMonthlyCents: Cents | null;
  currentSavingsCents: Cents | null;
  budgetItems: readonly BudgetItem[];
  scheduleBlocks: readonly ScheduleBlock[];
}

export interface PlanSummary {
  income: {
    takeHomeMonthlyCents: Cents;
    additionalMonthlyCents: Cents;
    totalMonthlyCents: Cents;
    hasTakeHome: boolean;
  };
  expenses: {
    fixedMonthlyCents: Cents;
    variableAllowanceMonthlyCents: Cents;
    uncoveredPlannedMonthlyCents: Cents;
    totalMonthlyCents: Cents;
  };
  savings: {
    plannedMonthlyCents: Cents;
    unallocatedMonthlyCents: Cents;
    totalMonthlyCents: Cents;
  };
  /** Recurring expenses ÷ total income × 100; null when income is zero. */
  percentOfIncomeSpent: number | null;
  /** Expenses + planned savings ÷ total income × 100; null when income is zero. */
  percentOfIncomeAllocated: number | null;
  relocation: {
    oneTimeCostsCents: Cents;
    currentSavingsCents: Cents | null;
    /** Savings left after one-time costs; null if savings are unknown. */
    positionBeforeMoveCents: Cents | null;
  };
  categories: CategoryReconciliation[];
  schedule: WeeklyScheduleSummary;
  status: PlanStatus;
}

function emptyReconciliation(categoryId: string): CategoryReconciliation {
  return {
    categoryId,
    fixedMonthlyCents: 0,
    allowanceMonthlyCents: 0,
    plannedMonthlyCents: 0,
    uncoveredPlannedMonthlyCents: 0,
    countedMonthlyCents: 0,
  };
}

export function calculatePlanSummary(input: PlanSummaryInput): PlanSummary {
  const takeHome = Math.max(0, input.takeHomeMonthlyCents ?? 0);

  let additionalIncome = 0;
  let plannedSavings = 0;
  let oneTimeCosts = 0;
  const byCategory = new Map<string, CategoryReconciliation>();
  const reconciliationFor = (categoryId: string) => {
    const group = topLevelCategoryId(categoryId);
    let entry = byCategory.get(group);
    if (!entry) {
      entry = emptyReconciliation(group);
      byCategory.set(group, entry);
    }
    return entry;
  };

  for (const item of input.budgetItems) {
    const amount = Math.max(0, item.amountCents);
    if (item.itemType === "relocation" || item.frequency === "one_time") {
      // Only relocation items are one-time by design; any other one-time item
      // is still kept out of the recurring totals rather than silently dropped.
      oneTimeCosts += amount;
      continue;
    }
    const monthly = toMonthlyCents(amount, item.frequency);
    switch (item.itemType) {
      case "income":
        additionalIncome += monthly;
        break;
      case "savings":
        plannedSavings += monthly;
        break;
      case "fixed":
        reconciliationFor(item.categoryId).fixedMonthlyCents += monthly;
        break;
      case "variable":
        reconciliationFor(item.categoryId).allowanceMonthlyCents += monthly;
        break;
    }
  }

  const schedule = summarizeSchedule(input.scheduleBlocks);
  for (const [group, weeklyCents] of Object.entries(schedule.weeklyByTopLevelCategory)) {
    reconciliationFor(group).plannedMonthlyCents += weeklyToMonthlyCents(weeklyCents);
  }

  let fixed = 0;
  let allowances = 0;
  let uncovered = 0;
  for (const entry of byCategory.values()) {
    entry.uncoveredPlannedMonthlyCents = Math.max(0, entry.plannedMonthlyCents - entry.allowanceMonthlyCents);
    entry.countedMonthlyCents = entry.fixedMonthlyCents + entry.allowanceMonthlyCents + entry.uncoveredPlannedMonthlyCents;
    fixed += entry.fixedMonthlyCents;
    allowances += entry.allowanceMonthlyCents;
    uncovered += entry.uncoveredPlannedMonthlyCents;
  }

  const totalIncome = takeHome + additionalIncome;
  const totalExpenses = fixed + allowances + uncovered;
  const unallocated = totalIncome - totalExpenses - plannedSavings;

  const currentSavings = input.currentSavingsCents ?? null;

  let status: PlanStatus;
  if (totalIncome <= 0) status = "missing_income";
  else if (unallocated < 0) status = "shortfall";
  else if (unallocated < totalIncome * THIN_MARGIN_RATIO) status = "thin_margin";
  else status = "balanced";

  const categories = [...byCategory.values()].sort((a, b) => b.countedMonthlyCents - a.countedMonthlyCents);

  return {
    income: {
      takeHomeMonthlyCents: takeHome,
      additionalMonthlyCents: additionalIncome,
      totalMonthlyCents: totalIncome,
      hasTakeHome: takeHome > 0,
    },
    expenses: {
      fixedMonthlyCents: fixed,
      variableAllowanceMonthlyCents: allowances,
      uncoveredPlannedMonthlyCents: uncovered,
      totalMonthlyCents: totalExpenses,
    },
    savings: {
      plannedMonthlyCents: plannedSavings,
      unallocatedMonthlyCents: unallocated,
      totalMonthlyCents: plannedSavings + Math.max(0, unallocated),
    },
    percentOfIncomeSpent: percentOf(totalExpenses, totalIncome),
    percentOfIncomeAllocated: percentOf(totalExpenses + plannedSavings, totalIncome),
    relocation: {
      oneTimeCostsCents: oneTimeCosts,
      currentSavingsCents: currentSavings,
      positionBeforeMoveCents: currentSavings === null ? null : currentSavings - oneTimeCosts,
    },
    categories,
    schedule,
    status,
  };
}
