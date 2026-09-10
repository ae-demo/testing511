// spec: tests/validation/test-plan.md § AC-005-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-005-b: a household member can rename an existing category", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const stamp = Date.now();
  const originalName = `E2E-005b-old-${stamp}`;
  const renamedName = `E2E-005b-new-${stamp}`;

  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(originalName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("cell", { name: originalName })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(originalName) }).click();
  await page.getByRole("textbox", { name: "Category name" }).fill(renamedName);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("cell", { name: renamedName })).toBeVisible();
  await expect(page.getByRole("cell", { name: originalName, exact: true })).toHaveCount(0);
});
