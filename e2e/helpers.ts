import { expect, type Page } from "@playwright/test";

/** Start a fresh demo session from the landing page. */
export async function startDemo(page: Page, start: "example" | "blank" = "example") {
  await page.goto("/");
  await page
    .getByRole("button", { name: start === "example" ? "Explore the example plan" : "Start from scratch" })
    .first()
    .click();
  await expect(page).toHaveURL(start === "example" ? /\/dashboard$/ : /\/onboarding$/);
}
