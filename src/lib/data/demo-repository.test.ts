import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { DemoRepository } from "./demo-repository";
import { resetDemoState } from "./demo-store";
import { NotFoundError, expandScheduleInput } from "./repository";

const budgetInput = {
  name: "Rent",
  itemType: "fixed" as const,
  categoryId: "housing.rent",
  amount: 150000,
  frequency: "monthly" as const,
  notes: null,
  costItemId: null,
};

describe("DemoRepository", () => {
  it("keeps each demo session's data separate", async () => {
    const aliceId = crypto.randomUUID();
    const bobId = crypto.randomUUID();
    resetDemoState(aliceId, "blank");
    resetDemoState(bobId, "blank");
    const alice = new DemoRepository(aliceId);
    const bob = new DemoRepository(bobId);

    const aliceScenario = await alice.getPrimaryScenario();
    const bobScenario = await bob.getPrimaryScenario();
    const item = await alice.createBudgetItem(aliceScenario.id, budgetInput);

    expect(await alice.listBudgetItems(aliceScenario.id)).toHaveLength(1);
    expect(await bob.listBudgetItems(bobScenario.id)).toHaveLength(0);

    // Bob cannot read, change or delete Alice's data, even with her IDs.
    await expect(bob.listBudgetItems(aliceScenario.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(bob.createBudgetItem(aliceScenario.id, budgetInput)).rejects.toBeInstanceOf(NotFoundError);
    await expect(bob.updateBudgetItem(item.id, { ...budgetInput, amount: 1 })).rejects.toBeInstanceOf(NotFoundError);
    await expect(bob.deleteBudgetItem(item.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await alice.listBudgetItems(aliceScenario.id))[0]?.amountCents).toBe(150000);
  });

  it("returns copies so callers cannot mutate stored state", async () => {
    const id = crypto.randomUUID();
    resetDemoState(id, "example");
    const repo = new DemoRepository(id);
    const profile = await repo.getProfile();
    profile.fullName = "Changed";
    expect((await repo.getProfile()).fullName).toBe("Demo user");
  });

  it("starts the example plan with demo-labelled data", async () => {
    const id = crypto.randomUUID();
    resetDemoState(id, "example");
    const repo = new DemoRepository(id);
    const scenario = await repo.getPrimaryScenario();
    expect(scenario.name).toMatch(/demo data/i);
    const items = await repo.listBudgetItems(scenario.id);
    expect(items.length).toBeGreaterThan(5);
    expect(items.every((item) => item.notes?.includes("demo data"))).toBe(true);
  });

  it("creates one schedule block per selected day", async () => {
    const id = crypto.randomUUID();
    resetDemoState(id, "blank");
    const repo = new DemoRepository(id);
    const scenario = await repo.getPrimaryScenario();
    const records = expandScheduleInput({
      title: "Gym",
      activityType: "fitness",
      days: [5, 1, 3, 1],
      startTime: "18:00",
      endTime: "19:00",
      estimatedCost: 0,
      categoryId: null,
      location: null,
      notes: null,
    });
    expect(records.map((r) => r.dayOfWeek)).toEqual([1, 3, 5]);
    await repo.createScheduleBlocks(scenario.id, records);
    expect(await repo.listScheduleBlocks(scenario.id)).toHaveLength(3);
  });
});
