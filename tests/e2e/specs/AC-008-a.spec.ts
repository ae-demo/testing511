// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-008-a: a household member can set a monthly spending limit on a category", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-008a-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*No limit set`) })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(categoryName) }).click();
  await page.getByRole("spinbutton", { name: "Monthly limit (home currency)" }).fill("250");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*250\\.00`) })).toBeVisible();
});
