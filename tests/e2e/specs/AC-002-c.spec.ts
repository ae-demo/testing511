// spec: tests/validation/test-plan.md § AC-002-c
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember, getAccessToken } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-002-c: creating an expense without a required field is rejected", async ({ page, request }) => {
  await loginAsHouseholdMember(page);
  const token = await getAccessToken(page);

  const catRes = await request.post(`${target("expense-api")}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: `E2E-002c-${Date.now()}` },
  });
  expect(catRes.status()).toBe(201);
  const category = await catRes.json();

  const today = new Date().toISOString().slice(0, 10);
  // amount is deliberately omitted
  const res = await request.post(`${target("expense-api")}/expenses`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { categoryId: category.id, currency: "USD", expenseDate: today },
  });
  expect(res.status()).toBe(400);
});
