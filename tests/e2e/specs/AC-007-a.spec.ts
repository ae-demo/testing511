// spec: tests/validation/test-plan.md § AC-007-a
// The app has no period picker (confirmed by reading Dashboard.tsx and
// Categories.tsx — the breakdown is always "this month"), so "a selected
// period" is the current calendar month shown in the Categories table's
// "Used this month" column.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-007-a: a per-category spending breakdown is shown for a selected period", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-007a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("50");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*50\\.00`) })).toBeVisible();
});
