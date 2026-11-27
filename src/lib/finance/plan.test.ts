import { describe, expect, it } from "vitest";
import type { BudgetItem, ScheduleBlock } from "@/lib/domain/types";
import { calculatePlanSummary } from "./plan";

let nextId = 0;
function item(overrides: Partial<BudgetItem>): BudgetItem {
  nextId += 1;
  return {
    id: `item-${nextId}`,
    scenarioId: "s1",
    categoryId: "other",
    costItemId: null,
    name: "Item",
    amountCents: 0,
    frequency: "monthly",
    itemType: "fixed",
    notes: null,
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

function block(overrides: Partial<ScheduleBlock>): ScheduleBlock {
  nextId += 1;
  return {
    id: `block-${nextId}`,
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

describe("calculatePlanSummary", () => {
  it("computes income, expenses, savings and percentage spent", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: 500000,
      currentSavingsCents: 800000,
      budgetItems: [
        item({ itemType: "income", categoryId: "income", amountCents: 20000, frequency: "monthly" }),
        item({ itemType: "fixed", categoryId: "housing.rent", amountCents: 180000 }),
        item({ itemType: "fixed", categoryId: "fitness.gym", amountCents: 60000, frequency: "yearly" }),
        item({ itemType: "variable", categoryId: "groceries", amountCents: 10000, frequency: "weekly" }),
        item({ itemType: "savings", categoryId: "savings.emergency", amountCents: 50000 }),
        item({ itemType: "relocation", categoryId: "relocation.deposit", amountCents: 180000, frequency: "one_time" }),
      ],
      scheduleBlocks: [],
    });

    expect(summary.income.totalMonthlyCents).toBe(520000);
    expect(summary.expenses.fixedMonthlyCents).toBe(185000); // 1800 + 600/12
    expect(summary.expenses.variableAllowanceMonthlyCents).toBe(43333); // 100 × 52 / 12
    expect(summary.expenses.totalMonthlyCents).toBe(228333);
    expect(summary.savings.plannedMonthlyCents).toBe(50000);
    expect(summary.savings.unallocatedMonthlyCents).toBe(520000 - 228333 - 50000);
    expect(summary.savings.totalMonthlyCents).toBe(50000 + 241667);
    expect(summary.percentOfIncomeSpent).toBeCloseTo((228333 / 520000) * 100, 5);
    expect(summary.relocation.oneTimeCostsCents).toBe(180000);
    expect(summary.relocation.positionBeforeMoveCents).toBe(620000);
    expect(summary.status).toBe("balanced");
  });

  it("does not double count planner spending covered by an allowance", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: 400000,
      currentSavingsCents: null,
      budgetItems: [item({ itemType: "variable", categoryId: "groceries", amountCents: 40000 })],
      // $60/week groceries → $260/month, under the $400 allowance
      scheduleBlocks: [block({ estimatedCostCents: 6000, categoryId: "groceries.produce" })],
    });
    const groceries = summary.categories.find((c) => c.categoryId === "groceries");
    expect(groceries?.plannedMonthlyCents).toBe(26000);
    expect(groceries?.uncoveredPlannedMonthlyCents).toBe(0);
    expect(summary.expenses.totalMonthlyCents).toBe(40000);
  });

  it("adds only the planner spending above an allowance", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: 400000,
      currentSavingsCents: null,
      budgetItems: [item({ itemType: "variable", categoryId: "lifestyle.restaurants", amountCents: 10000 })],
      // $50/week dining → $216.67/month vs $100 allowance
      scheduleBlocks: [block({ estimatedCostCents: 5000, categoryId: "lifestyle.restaurants" })],
    });
    expect(summary.expenses.uncoveredPlannedMonthlyCents).toBe(21667 - 10000);
    expect(summary.expenses.totalMonthlyCents).toBe(21667);
  });

  it("counts planner spending fully when there is no allowance, even next to a fixed cost", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: 400000,
      currentSavingsCents: null,
      budgetItems: [item({ itemType: "fixed", categoryId: "fitness.gym", amountCents: 5000 })],
      scheduleBlocks: [block({ estimatedCostCents: 2500, categoryId: "fitness.classes" })],
    });
    expect(summary.expenses.fixedMonthlyCents).toBe(5000);
    expect(summary.expenses.uncoveredPlannedMonthlyCents).toBe(10833);
    expect(summary.expenses.totalMonthlyCents).toBe(15833);
  });

  it("reports missing income without dividing by zero", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: null,
      currentSavingsCents: null,
      budgetItems: [item({ itemType: "fixed", amountCents: 100000 })],
      scheduleBlocks: [],
    });
    expect(summary.status).toBe("missing_income");
    expect(summary.percentOfIncomeSpent).toBeNull();
    expect(summary.relocation.positionBeforeMoveCents).toBeNull();
  });

  it("flags a shortfall and a thin margin", () => {
    const shortfall = calculatePlanSummary({
      takeHomeMonthlyCents: 300000,
      currentSavingsCents: 0,
      budgetItems: [item({ itemType: "fixed", amountCents: 250000 }), item({ itemType: "savings", categoryId: "savings.general", amountCents: 60000 })],
      scheduleBlocks: [],
    });
    expect(shortfall.status).toBe("shortfall");
    expect(shortfall.savings.unallocatedMonthlyCents).toBe(-10000);
    expect(shortfall.savings.totalMonthlyCents).toBe(60000);

    const thin = calculatePlanSummary({
      takeHomeMonthlyCents: 300000,
      currentSavingsCents: 0,
      budgetItems: [item({ itemType: "fixed", amountCents: 290000 })],
      scheduleBlocks: [],
    });
    expect(thin.status).toBe("thin_margin");
  });

  it("keeps non-relocation one-time items out of monthly totals", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: 100000,
      currentSavingsCents: 50000,
      budgetItems: [item({ itemType: "fixed", amountCents: 20000, frequency: "one_time" })],
      scheduleBlocks: [],
    });
    expect(summary.expenses.totalMonthlyCents).toBe(0);
    expect(summary.relocation.oneTimeCostsCents).toBe(20000);
  });

  it("treats negative stored amounts as zero", () => {
    const summary = calculatePlanSummary({
      takeHomeMonthlyCents: -100,
      currentSavingsCents: null,
      budgetItems: [item({ itemType: "fixed", amountCents: -500 })],
      scheduleBlocks: [],
    });
    expect(summary.income.totalMonthlyCents).toBe(0);
    expect(summary.expenses.totalMonthlyCents).toBe(0);
  });
});
