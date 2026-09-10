// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-009-a: each category shows the amount used against its limit for the current calendar month", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-009a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly limit (home currency)" }).fill("200");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("60");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByRole("link", { name: "Categories" }).click();
  // "Category | Monthly limit | Used this month | Status" -> limit 200.00, used 60.00
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*200\\.00.*60\\.00`) })).toBeVisible();
});
