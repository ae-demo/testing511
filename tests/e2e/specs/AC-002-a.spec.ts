// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-002-a: a household member can create an expense with amount, category, and date", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-002a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("42.50");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(`${categoryName} 42\\.50`) });
  await expect(row).toBeVisible();
});
