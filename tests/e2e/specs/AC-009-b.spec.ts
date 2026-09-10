// spec: tests/validation/test-plan.md § AC-009-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-009-b: a category whose spending exceeds its limit is visibly flagged as over limit", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-009b-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly limit (home currency)" }).fill("10");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("50");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByRole("link", { name: "Categories" }).click();
  const row = page.getByRole("row", { name: new RegExp(categoryName) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Over limit")).toBeVisible();
});
