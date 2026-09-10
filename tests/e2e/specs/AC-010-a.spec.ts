// spec: tests/validation/test-plan.md § AC-010-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-010-a: an expense can be entered in a currency other than the household's home currency", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-010a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("100");
  await page.getByRole("combobox", { name: /^Currency/ }).click();
  await page.getByRole("option", { name: "EUR", exact: true }).click();
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  // No client-side error is shown and we land back on the Dashboard with the
  // new expense listed — the create succeeded for a non-home currency.
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(categoryName) })).toBeVisible();
});
