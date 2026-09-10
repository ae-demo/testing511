// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember, getAccessToken } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-004-a: an expense cannot be created without a category", async ({ page, request }) => {
  await loginAsHouseholdMember(page);
  const token = await getAccessToken(page);

  const today = new Date().toISOString().slice(0, 10);
  // categoryId is deliberately omitted
  const res = await request.post(`${target("expense-api")}/expenses`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { amount: 25, currency: "USD", expenseDate: today },
  });
  expect(res.status()).toBe(400);
});
