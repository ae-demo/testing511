// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-007-b: the per-category breakdown updates when a new expense is added to that category", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-007b-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("20");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*20\\.00`) })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("15");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*35\\.00`) })).toBeVisible();
});
