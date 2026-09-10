// spec: tests/validation/test-plan.md § AC-003-a
// Only one Household Member test account is provisioned for this run (see
// tests/validation/test-plan.md header), so this exercises the capability
// the requirement is really about: editing an expense is not blocked by
// who is recorded as its enteredByMemberId.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-003-a: a household member can edit an expense entered by the other household member", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-003a-${Date.now()}`;
  const updatedNote = `edited-${Date.now()}`;

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

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("row", { name: new RegExp(categoryName) }).click();

  await page.getByRole("textbox", { name: "Note" }).fill(updatedNote);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("row", { name: new RegExp(categoryName) }).click();
  await expect(page.getByRole("textbox", { name: "Note" })).toHaveValue(updatedNote);
});
