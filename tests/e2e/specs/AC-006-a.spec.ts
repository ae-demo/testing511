// spec: tests/validation/test-plan.md § AC-006-a
// The deployed environment is shared and not reset between runs, so this
// reads the "Today" total before and after adding a known expense and
// asserts the delta, rather than assuming a zero starting total.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";
import { readStatValue } from "../lib/dashboard";

test("AC-006-a: the dashboard shows a total for today's expenses", async ({ page }) => {
  await loginAsHouseholdMember(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const before = await readStatValue(page, "Today");

  const categoryName = `E2E-006a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("11.25");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect.poll(() => readStatValue(page, "Today")).toBeCloseTo(before + 11.25, 1);
});
