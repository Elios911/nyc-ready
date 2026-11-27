import "server-only";
import { cache } from "react";
import { calculatePlanSummary } from "@/lib/finance/plan";
import { getRepository } from "./index";

/**
 * Everything the dashboard, budget and planner pages need, loaded once per
 * request. Scenario values override profile values when set.
 */
export const loadPlan = cache(async () => {
  const repository = await getRepository();
  const [profile, scenario] = await Promise.all([repository.getProfile(), repository.getPrimaryScenario()]);
  const [budgetItems, scheduleBlocks] = await Promise.all([
    repository.listBudgetItems(scenario.id),
    repository.listScheduleBlocks(scenario.id),
  ]);

  const takeHomeMonthlyCents = scenario.monthlyTakeHomeIncomeCents ?? profile.monthlyTakeHomeIncomeCents;
  const currentSavingsCents = scenario.currentSavingsCents ?? profile.currentSavingsCents;
  const summary = calculatePlanSummary({ takeHomeMonthlyCents, currentSavingsCents, budgetItems, scheduleBlocks });

  return { profile, scenario, budgetItems, scheduleBlocks, summary };
});

export type LoadedPlan = Awaited<ReturnType<typeof loadPlan>>;
