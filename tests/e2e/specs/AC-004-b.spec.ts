// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-004-b: an expense's category can be changed after creation", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const stamp = Date.now();
  const categoryA = `E2E-004b-A-${stamp}`;
  const categoryB = `E2E-004b-B-${stamp}`;

  for (const name of [categoryA, categoryB]) {
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("button", { name: "New category" }).first().click();
    await page.getByRole("textbox", { name: "Category name" }).fill(name);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("cell", { name })).toBeVisible();
  }

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("18");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryA }).click();
  await page.getByRole("button", { name: "Save expense" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("row", { name: new RegExp(categoryA) }).click();

  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryB }).click();
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(categoryB) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(categoryA) })).toHaveCount(0);
});
