// spec: tests/validation/test-plan.md § AC-005-c
// The webapp has no delete affordance for categories (confirmed by reading
// expense-webapp/src/pages/Categories.tsx and CategoryDetail.tsx — unlike
// ExpenseDetail.tsx, neither renders a "Delete" control), so this exercises
// the capability directly against expense-api's documented deleteCategory
// operation.
import { test, expect } from "@playwright/test";
import { loginAsHouseholdMember, getAccessToken } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-005-c: a household member can remove a category", async ({ page, request }) => {
  await loginAsHouseholdMember(page);
  const token = await getAccessToken(page);
  const headers = { Authorization: `Bearer ${token}` };

  const createRes = await request.post(`${target("expense-api")}/categories`, {
    headers,
    data: { name: `E2E-005c-${Date.now()}` },
  });
  expect(createRes.status()).toBe(201);
  const category = await createRes.json();

  const deleteRes = await request.delete(`${target("expense-api")}/categories/${category.id}`, { headers });
  expect(deleteRes.status()).toBe(204);

  const listRes = await request.get(`${target("expense-api")}/categories?limit=100`, { headers });
  const list = await listRes.json();
  expect(list.data.some((c: { id: string }) => c.id === category.id)).toBe(false);
});
