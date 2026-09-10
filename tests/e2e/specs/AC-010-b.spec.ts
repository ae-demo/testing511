// spec: tests/validation/test-plan.md § AC-010-b
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember, getAccessToken } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-010-b: a foreign-currency expense is converted to the home currency and included in totals and category usage", async ({
  page,
  request,
}) => {
  await loginAsHouseholdMember(page);
  const token = await getAccessToken(page);
  const headers = { Authorization: `Bearer ${token}` };

  const catRes = await request.post(`${target("expense-api")}/categories`, {
    headers,
    data: { name: `E2E-010b-${Date.now()}` },
  });
  expect(catRes.status()).toBe(201);
  const category = await catRes.json();

  const today = new Date().toISOString().slice(0, 10);
  const expenseRes = await request.post(`${target("expense-api")}/expenses`, {
    headers,
    data: { categoryId: category.id, amount: 100, currency: "EUR", expenseDate: today },
  });
  expect(expenseRes.status()).toBe(201);
  const expense = await expenseRes.json();

  expect(expense.originalAmount).toBe(100);
  expect(expense.originalCurrency).toBe("EUR");
  expect(expense.homeCurrency).toBe("USD");
  // A real conversion happened, not a pass-through of the entered amount.
  expect(expense.homeAmount).not.toBe(expense.originalAmount);
  expect(expense.homeAmount).toBeGreaterThan(0);

  const categoriesRes = await request.get(`${target("expense-api")}/categories?limit=100`, { headers });
  const categories = await categoriesRes.json();
  const updated = categories.data.find((c: { id: string }) => c.id === category.id);
  expect(updated.currentMonthUsage).toBeGreaterThanOrEqual(expense.homeAmount - 0.01);
});
