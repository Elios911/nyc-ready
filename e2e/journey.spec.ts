import { expect, test } from "@playwright/test";
import { startDemo } from "./helpers";

test("protected pages redirect to sign-in without a session", async ({ page }) => {
  await page.goto("/budget");
  await expect(page).toHaveURL(/\/login\?next=%2Fbudget/);
  await expect(page.getByText("Accounts aren't set up on this server")).toBeVisible();
});

test("example plan shows a labelled demo dashboard", async ({ page }) => {
  await startDemo(page, "example");
  await expect(page.getByText("Demo mode.", { exact: false })).toBeVisible();
  await expect(page.getByText("Monthly take-home")).toBeVisible();
  await expect(page.getByText("$4,200").first()).toBeVisible();
  await expect(page.getByText("Where your money goes each month")).toBeVisible();
  await expect(page.getByText("How this is calculated")).toBeVisible();
});

test("a new user can onboard, budget, plan a week and see the summary update", async ({ page }) => {
  await startDemo(page, "blank");

  // Onboarding requires take-home pay.
  await page.getByRole("button", { name: "Continue to my plan" }).click();
  await expect(page.getByText("Enter an amount")).toBeVisible();
  await page.getByLabel("Monthly take-home pay").fill("4,000");
  await page.getByLabel("Current savings").fill("5000");
  await page.getByRole("button", { name: "Continue to my plan" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("$4,000").first()).toBeVisible();

  // Add rent as a fixed expense.
  await page.goto("/budget");
  const fixed = page.getByTestId("budget-section-fixed");
  await fixed.getByRole("button", { name: "Add expense" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Rent");
  await dialog.getByLabel("Amount").fill("1500");
  await dialog.getByRole("button", { name: "Add item" }).click();
  await expect(dialog).toBeHidden();
  await expect(fixed.getByText("Rent", { exact: true }).first()).toBeVisible();
  await expect(fixed.getByText("$1,500.00")).toBeVisible();

  // Add a $100/month restaurants allowance.
  const variable = page.getByTestId("budget-section-variable");
  await variable.getByRole("button", { name: "Add allowance" }).click();
  await dialog.getByLabel("Name").fill("Eating out");
  await dialog.getByLabel("Category").selectOption("lifestyle.restaurants");
  await dialog.getByLabel("Amount").fill("100");
  await dialog.getByRole("button", { name: "Add item" }).click();
  await expect(dialog).toBeHidden();

  // Plan dinner out twice a week at $40 → $80/week ≈ $346.67/month, above the $100 allowance.
  await page.goto("/planner");
  await page.getByRole("button", { name: "Add activity" }).first().click();
  await dialog.getByLabel("Activity").selectOption("dining_out");
  await dialog.getByLabel("Name").fill("Dinner out");
  await dialog.getByRole("button", { name: "Wed" }).click();
  await dialog.getByRole("button", { name: "Fri" }).click();
  await dialog.getByLabel("Starts").fill("19:00");
  await dialog.getByLabel("Ends").fill("21:00");
  await dialog.getByLabel("Estimated spending").fill("40");
  await dialog.getByRole("button", { name: "Add to 2 days" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("day-3").getByText("Dinner out")).toBeVisible();
  await expect(page.getByTestId("day-5").getByText("Dinner out")).toBeVisible();
  await expect(page.getByText("$80").first()).toBeVisible();

  // Budget counts only the planner spending above the allowance: $346.67 − $100 = $246.67.
  await page.goto("/budget");
  await expect(page.getByText("Planner spending not covered by allowances")).toBeVisible();
  await expect(page.getByText("$246.67").first()).toBeVisible();
  // Expenses: 1500 + 100 + 246.67 = 1846.67; unallocated: 4000 − 1846.67 = 2153.33
  await expect(page.getByText("$2,153.33").first()).toBeVisible();

  // Delete the rent item.
  await fixed.getByRole("button", { name: "Delete Rent" }).click();
  await fixed.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(fixed.getByRole("button", { name: "Edit Rent" })).toHaveCount(0);
});

test("Cost Explorer labels demo prices and can add an item to the budget", async ({ page }) => {
  await startDemo(page, "blank");
  await page.goto("/explore?q=milk");
  await expect(page.getByText("These prices are demonstration data")).toBeVisible();
  const card = page.getByTestId("catalog-entry").filter({ hasText: "Whole milk" });
  await expect(card.getByText("Demo data").first()).toBeVisible();
  await expect(card.getByText("$3.00").first()).toBeVisible();
  await expect(card.getByText("for 0.5 gallon")).toBeVisible();
  await expect(card.getByText("$6.00 / gallon").first()).toBeVisible(); // unit price of the half gallon
  await card.getByRole("button", { name: "Add Whole milk to budget" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Name")).toHaveValue("Whole milk");
  await dialog.getByRole("button", { name: "Add item" }).click();
  await expect(dialog).toBeHidden();
  await page.goto("/budget");
  await expect(page.getByTestId("budget-section-variable").getByText("Whole milk")).toBeVisible();
  await expect(page.getByText("from Cost Explorer").first()).toBeVisible();
});

test("Cost Explorer filters by category and shows an empty state", async ({ page }) => {
  await startDemo(page, "example");
  await page.goto("/explore");
  await page.getByRole("link", { name: "Fitness" }).click();
  await expect(page).toHaveURL(/category=fitness/);
  await expect(page.getByText("Budget gym membership")).toBeVisible();
  await expect(page.getByText("Whole milk")).toBeHidden();
  await page.goto("/explore?q=zzzz-not-a-thing");
  await expect(page.getByText("No matching items")).toBeVisible();
});

test("demo sessions cannot see each other's data", async ({ browser }) => {
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  const alicePage = await alice.newPage();
  const bobPage = await bob.newPage();
  await startDemo(alicePage, "blank");
  await startDemo(bobPage, "blank");

  await alicePage.goto("/budget");
  await alicePage.getByTestId("budget-section-fixed").getByRole("button", { name: "Add expense" }).click();
  await alicePage.getByRole("dialog").getByLabel("Name").fill("Alice's secret rent");
  await alicePage.getByRole("dialog").getByLabel("Amount").fill("999");
  await alicePage.getByRole("dialog").getByRole("button", { name: "Add item" }).click();
  await expect(alicePage.getByTestId("budget-section-fixed").getByText("Alice's secret rent")).toBeVisible();

  await bobPage.goto("/budget");
  await expect(bobPage.getByRole("heading", { name: "My Budget" })).toBeVisible();
  await expect(bobPage.getByText("Alice's secret rent")).toHaveCount(0);
  await alice.close();
  await bob.close();
});

test("mobile navigation works @mobile", async ({ page }) => {
  await startDemo(page, "example");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Weekly Planner" }).click();
  await expect(page).toHaveURL(/\/planner$/);
  await expect(page.getByRole("heading", { name: "Weekly Planner" })).toBeVisible();
});
