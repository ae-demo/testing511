// spec: tests/validation/test-plan.md § AC-006-c
// The deployed environment is shared and not reset between runs, so this
// reads the "This Month" total before and after adding a known expense and
// asserts the delta, rather than assuming a zero starting total.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";
import { readStatValue } from "../lib/dashboard";

test("AC-006-c: the dashboard shows a total for the current calendar month", async ({ page }) => {
  await loginAsHouseholdMember(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const before = await readStatValue(page, "This Month");

  const categoryName = `E2E-006c-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("9.5");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect.poll(() => readStatValue(page, "This Month")).toBeCloseTo(before + 9.5, 1);
});
