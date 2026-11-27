import { describe, expect, it } from "vitest";
import { budgetItemSchema } from "./budget";
import { onboardingSchema, profileSchema } from "./profile";
import { scheduleBlockSchema } from "./schedule";

const emptyProfile = {
  fullName: "",
  expectedMoveDate: "",
  annualGrossIncome: "",
  monthlyTakeHomeIncome: "",
  currentSavings: "",
  householdSize: "",
  livingArrangement: "" as const,
  preferredNeighborhoods: "",
  workLocation: "",
  commuteDaysPerWeek: "",
  lifestylePreferences: [],
};

describe("profileSchema", () => {
  it("turns empty strings into nulls and dollars into cents", () => {
    const result = profileSchema.parse({
      ...emptyProfile,
      monthlyTakeHomeIncome: "4,250.50",
      preferredNeighborhoods: "Astoria, Bushwick , ,Harlem",
      commuteDaysPerWeek: "3",
    });
    expect(result.monthlyTakeHomeIncome).toBe(425050);
    expect(result.annualGrossIncome).toBeNull();
    expect(result.fullName).toBeNull();
    expect(result.preferredNeighborhoods).toEqual(["Astoria", "Bushwick", "Harlem"]);
    expect(result.commuteDaysPerWeek).toBe(3);
    expect(result.livingArrangement).toBeNull();
  });

  it("rejects invalid numbers", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, commuteDaysPerWeek: "8" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...emptyProfile, currentSavings: "-100" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...emptyProfile, expectedMoveDate: "next week" }).success).toBe(false);
  });

  it("requires take-home pay during onboarding", () => {
    expect(onboardingSchema.safeParse(emptyProfile).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...emptyProfile, monthlyTakeHomeIncome: "4000" }).success).toBe(true);
  });
});

describe("budgetItemSchema", () => {
  const base = { name: "Rent", itemType: "fixed" as const, categoryId: "housing.rent", amount: "1800", frequency: "monthly" as const, notes: "" };

  it("parses a valid item", () => {
    expect(budgetItemSchema.parse(base)).toMatchObject({ amount: 180000, notes: null, costItemId: null });
  });

  it("enforces that only relocation costs are one-time", () => {
    expect(budgetItemSchema.safeParse({ ...base, frequency: "one_time" }).success).toBe(false);
    expect(
      budgetItemSchema.safeParse({ ...base, itemType: "relocation", categoryId: "relocation.deposit", frequency: "monthly" }).success,
    ).toBe(false);
    expect(
      budgetItemSchema.safeParse({ ...base, itemType: "relocation", categoryId: "relocation.deposit", frequency: "one_time" }).success,
    ).toBe(true);
  });

  it("checks the category fits the item type", () => {
    expect(budgetItemSchema.safeParse({ ...base, itemType: "income", categoryId: "housing.rent" }).success).toBe(false);
    expect(budgetItemSchema.safeParse({ ...base, categoryId: "not-a-category" }).success).toBe(false);
  });
});

describe("scheduleBlockSchema", () => {
  const base = {
    title: "Gym",
    activityType: "fitness" as const,
    days: [1, 3],
    startTime: "18:00",
    endTime: "19:00",
    estimatedCost: "",
    categoryId: "",
    location: "",
    notes: "",
  };

  it("parses a valid block with no cost", () => {
    expect(scheduleBlockSchema.parse(base)).toMatchObject({ estimatedCost: 0, categoryId: null, days: [1, 3] });
  });

  it("requires end after start and at least one day", () => {
    expect(scheduleBlockSchema.safeParse({ ...base, endTime: "17:00" }).success).toBe(false);
    expect(scheduleBlockSchema.safeParse({ ...base, days: [] }).success).toBe(false);
    expect(scheduleBlockSchema.safeParse({ ...base, days: [8] }).success).toBe(false);
  });

  it("requires a category when the activity costs money", () => {
    expect(scheduleBlockSchema.safeParse({ ...base, estimatedCost: "12" }).success).toBe(false);
    expect(scheduleBlockSchema.safeParse({ ...base, estimatedCost: "12", categoryId: "fitness.classes" }).success).toBe(true);
  });
});
