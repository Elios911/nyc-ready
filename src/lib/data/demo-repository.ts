import type { BudgetItem, Profile, ScheduleBlock } from "@/lib/domain/types";
import type { BudgetItemInput } from "@/lib/validation/budget";
import type { ProfileInput } from "@/lib/validation/profile";
import { getDemoState, type DemoState } from "./demo-store";
import { NotFoundError, type PlanRepository, type ScheduleBlockRecordInput } from "./repository";

function profileFromInput(current: Profile, input: ProfileInput, completeOnboarding: boolean): Profile {
  return {
    ...current,
    fullName: input.fullName,
    expectedMoveDate: input.expectedMoveDate,
    annualGrossIncomeCents: input.annualGrossIncome,
    monthlyTakeHomeIncomeCents: input.monthlyTakeHomeIncome,
    currentSavingsCents: input.currentSavings,
    householdSize: input.householdSize,
    livingArrangement: input.livingArrangement,
    preferredNeighborhoods: input.preferredNeighborhoods,
    workLocation: input.workLocation,
    commuteDaysPerWeek: input.commuteDaysPerWeek,
    lifestylePreferences: input.lifestylePreferences,
    onboardingCompletedAt: completeOnboarding ? (current.onboardingCompletedAt ?? new Date().toISOString()) : current.onboardingCompletedAt,
  };
}

function budgetItemFromInput(id: string, scenarioId: string, input: BudgetItemInput, createdAt: string): BudgetItem {
  return {
    id,
    scenarioId,
    categoryId: input.categoryId,
    costItemId: input.costItemId,
    name: input.name,
    amountCents: input.amount,
    frequency: input.frequency,
    itemType: input.itemType,
    notes: input.notes,
    createdAt,
  };
}

function blockFromInput(id: string, scenarioId: string, input: ScheduleBlockRecordInput): ScheduleBlock {
  return {
    id,
    scenarioId,
    dayOfWeek: input.dayOfWeek,
    title: input.title,
    activityType: input.activityType,
    startTime: input.startTime,
    endTime: input.endTime,
    estimatedCostCents: input.estimatedCost,
    categoryId: input.categoryId,
    location: input.location,
    notes: input.notes,
  };
}

/**
 * Demo-mode repository. Scoped to one demo session ID; it can only ever read
 * or change that session's in-memory state.
 */
export class DemoRepository implements PlanRepository {
  constructor(private readonly sessionId: string) {}

  private state(): DemoState {
    return getDemoState(this.sessionId);
  }

  private assertScenario(scenarioId: string) {
    if (this.state().scenario.id !== scenarioId) throw new NotFoundError("Scenario");
  }

  async getProfile() {
    return structuredClone(this.state().profile);
  }

  async updateProfile(input: ProfileInput, options: { completeOnboarding?: boolean } = {}) {
    const state = this.state();
    state.profile = profileFromInput(state.profile, input, Boolean(options.completeOnboarding));
    return structuredClone(state.profile);
  }

  async getPrimaryScenario() {
    return structuredClone(this.state().scenario);
  }

  async listBudgetItems(scenarioId: string) {
    this.assertScenario(scenarioId);
    return structuredClone(this.state().budgetItems);
  }

  async createBudgetItem(scenarioId: string, input: BudgetItemInput) {
    this.assertScenario(scenarioId);
    const item = budgetItemFromInput(crypto.randomUUID(), scenarioId, input, new Date().toISOString());
    this.state().budgetItems.push(item);
    return structuredClone(item);
  }

  async updateBudgetItem(id: string, input: BudgetItemInput) {
    const items = this.state().budgetItems;
    const index = items.findIndex((item) => item.id === id);
    const existing = items[index];
    if (!existing) throw new NotFoundError("Budget item");
    const updated = budgetItemFromInput(id, existing.scenarioId, input, existing.createdAt);
    items[index] = updated;
    return structuredClone(updated);
  }

  async deleteBudgetItem(id: string) {
    const state = this.state();
    const before = state.budgetItems.length;
    state.budgetItems = state.budgetItems.filter((item) => item.id !== id);
    if (state.budgetItems.length === before) throw new NotFoundError("Budget item");
  }

  async listScheduleBlocks(scenarioId: string) {
    this.assertScenario(scenarioId);
    return structuredClone(this.state().scheduleBlocks);
  }

  async createScheduleBlocks(scenarioId: string, inputs: ScheduleBlockRecordInput[]) {
    this.assertScenario(scenarioId);
    const blocks = inputs.map((input) => blockFromInput(crypto.randomUUID(), scenarioId, input));
    this.state().scheduleBlocks.push(...blocks);
    return structuredClone(blocks);
  }

  async updateScheduleBlock(id: string, input: ScheduleBlockRecordInput) {
    const blocks = this.state().scheduleBlocks;
    const index = blocks.findIndex((block) => block.id === id);
    const existing = blocks[index];
    if (!existing) throw new NotFoundError("Schedule block");
    const updated = blockFromInput(id, existing.scenarioId, input);
    blocks[index] = updated;
    return structuredClone(updated);
  }

  async deleteScheduleBlock(id: string) {
    const state = this.state();
    const before = state.scheduleBlocks.length;
    state.scheduleBlocks = state.scheduleBlocks.filter((block) => block.id !== id);
    if (state.scheduleBlocks.length === before) throw new NotFoundError("Schedule block");
  }
}
