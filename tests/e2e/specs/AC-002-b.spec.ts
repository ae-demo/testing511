// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-002-b: a household member can add an optional note to an expense", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-002b-${Date.now()}`;
  const note = `note-${Date.now()}`;

  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();

  await page.getByRole("link", { name: "Add Expense" }).click();
  await page.getByRole("spinbutton", { name: "Amount" }).fill("15");
  await page.getByRole("combobox", { name: /^Category/ }).click();
  await page.getByRole("option", { name: categoryName }).click();
  await page.getByRole("textbox", { name: "Note (optional)" }).fill(note);
  await page.getByRole("button", { name: "Save expense" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("row", { name: new RegExp(categoryName) }).click();

  await expect(page.getByRole("textbox", { name: "Note" })).toHaveValue(note);
});
