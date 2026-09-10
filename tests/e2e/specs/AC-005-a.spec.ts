// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-005-a: a household member can create a new category", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-005a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("cell", { name: categoryName })).toBeVisible();
});
