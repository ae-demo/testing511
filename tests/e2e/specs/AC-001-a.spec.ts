// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember } from "../lib/auth";

test("AC-001-a: a household member can sign in through the platform's sign-in flow", async ({ page }) => {
  await loginAsHouseholdMember(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
