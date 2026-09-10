// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";

test("AC-001-b: an unauthenticated visitor cannot view the shared expense data", async ({ request }) => {
  const res = await request.get(`${target("expense-api")}/expenses`);
  expect(res.status()).toBe(401);
});
