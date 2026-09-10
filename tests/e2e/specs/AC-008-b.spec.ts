// spec: tests/validation/test-plan.md § AC-008-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-008-b: a household member can update an existing category's spending limit", async ({ page }) => {
  await loginAsHouseholdMember(page);

  const categoryName = `E2E-008b-${Date.now()}`;
  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByRole("button", { name: "New category" }).first().click();
  await page.getByRole("textbox", { name: "Category name" }).fill(categoryName);
  await page.getByRole("spinbutton", { name: "Monthly limit (home currency)" }).fill("100");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*100\\.00`) })).toBeVisible();

  await page.getByRole("row", { name: new RegExp(categoryName) }).click();
  await page.getByRole("spinbutton", { name: "Monthly limit (home currency)" }).fill("180");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(`${categoryName}.*180\\.00`) })).toBeVisible();
});
