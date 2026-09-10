import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/expense-api";

type Category = components["schemas"]["Category"];
type Expense = components["schemas"]["Expense"];
type Error_ = components["schemas"]["Error"];

// The household's one home currency (PRD: "The household sets one home
// currency" *assumed*). Every total, breakdown and limit is expressed in it.
const HOME_CURRENCY = "USD";

// A fixed mock exchange table so a foreign-currency expense still produces a
// plausible converted homeAmount — expense-api owns the real conversion
// (currency-service), this only keeps the mock's numbers coherent.
const MOCK_FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  CAD: 0.74,
  JPY: 0.0067,
  INR: 0.012,
  SGD: 0.75,
};

function toHomeAmount(amount: number, currency: string): number {
  const rate = MOCK_FX_RATES[currency] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

// Held in module scope so the app behaves like an app: a create shows up in
// the next list, a delete removes it, an edit persists — but only across
// in-app navigation. `setupWorker` resolves every request in the page's own
// JS context, so any full page load (reload, typed/opened URL, a link that
// leaves the SPA) re-runs this module and puts the seed data back.
function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Clamped so every seed row stays inside the CURRENT calendar month
// regardless of when the mock happens to be walked (the household's monthly
// limit usage is scoped to the current calendar month).
function daysAgoThisMonth(days: number): string {
  const dayOfMonth = new Date().getDate();
  return isoDaysAgo(Math.min(days, Math.max(dayOfMonth - 1, 0)));
}

let nextId = 100;
function newId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

let categories: Category[] = [
  { id: "cat-groceries", name: "Groceries", monthlyLimitAmount: 400.0, currentMonthUsage: 0 },
  { id: "cat-utilities", name: "Utilities", monthlyLimitAmount: 200.0, currentMonthUsage: 0 },
  { id: "cat-dining", name: "Dining", monthlyLimitAmount: 150.0, currentMonthUsage: 0 },
];

let expenses: Expense[] = [
  // These three sum, per category, to the wireframe's Categories screen
  // figures (Groceries 312.50, Utilities 220.00 — over its 200.00 limit —
  // Dining 98.00), and the three most recent are the wireframe's Dashboard
  // "Recent expenses" rows.
  {
    id: "exp-1",
    categoryId: "cat-groceries",
    enteredByMemberId: "mock-household-member",
    originalAmount: 54.2,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 54.2,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(0),
    note: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-2",
    categoryId: "cat-utilities",
    enteredByMemberId: "mock-spouse",
    originalAmount: 120.0,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 120.0,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(1),
    note: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-3",
    categoryId: "cat-dining",
    enteredByMemberId: "mock-household-member",
    originalAmount: 32.4,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 32.4,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(2),
    note: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-4",
    categoryId: "cat-groceries",
    enteredByMemberId: "mock-spouse",
    originalAmount: 120.3,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 120.3,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(6),
    note: "Weekly shop",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-5",
    categoryId: "cat-groceries",
    enteredByMemberId: "mock-household-member",
    originalAmount: 100.0,
    originalCurrency: "EUR",
    homeAmount: toHomeAmount(100.0, "EUR"),
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(12),
    note: "Foreign supermarket run",
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-6",
    categoryId: "cat-utilities",
    enteredByMemberId: "mock-household-member",
    originalAmount: 100.0,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 100.0,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(15),
    note: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "exp-7",
    categoryId: "cat-dining",
    enteredByMemberId: "mock-spouse",
    originalAmount: 65.6,
    originalCurrency: HOME_CURRENCY,
    homeAmount: 65.6,
    homeCurrency: HOME_CURRENCY,
    expenseDate: daysAgoThisMonth(9),
    note: null,
    createdAt: new Date().toISOString(),
  },
];
// exp-5's originalAmount is in EUR: 100 * 1.08 rounds to 108, so recompute
// Groceries' month total below from the live array rather than a literal —
// the point of deriving everything from `expenses` is that it never drifts.

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function periodRange(period: "day" | "week" | "month", dateParam?: string): { from: Date; to: Date } {
  const ref = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  if (period === "day") {
    const from = new Date(ref);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }
  if (period === "week") {
    const from = startOfWeekMonday(ref);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from, to };
  }
  const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const to = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  return { from, to };
}

function expensesIn(period: "day" | "week" | "month", dateParam?: string): Expense[] {
  const { from, to } = periodRange(period, dateParam);
  return expenses.filter((e) => {
    const d = new Date(`${e.expenseDate}T00:00:00`);
    return d >= from && d < to;
  });
}

function currentMonthUsage(categoryId: string): number {
  return expensesIn("month")
    .filter((e) => e.categoryId === categoryId)
    .reduce((sum, e) => sum + e.homeAmount, 0);
}

function withUsage(category: Category): Category {
  return { ...category, currentMonthUsage: Math.round(currentMonthUsage(category.id) * 100) / 100 };
}

function notFound(message: string): Error_ {
  return { code: 404, message };
}

export const handlers = [
  // --- categories ---------------------------------------------------------
  http.get("/api/categories", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const withUsageData = categories.map(withUsage);
    return HttpResponse.json({
      count: withUsageData.length,
      next: null,
      previous: null,
      data: withUsageData.slice(offset, offset + limit),
    });
  }),

  http.post("/api/categories", async ({ request }) => {
    const input = (await request.json()) as { name?: string };
    if (!input?.name) {
      return HttpResponse.json({ code: 400, message: "name is required" }, { status: 400 });
    }
    const created: Category = { id: newId("cat"), name: input.name, monthlyLimitAmount: null, currentMonthUsage: 0 };
    categories = [...categories, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/categories/:categoryId/limit", async ({ params, request }) => {
    const category = categories.find((c) => c.id === params.categoryId);
    if (!category) return HttpResponse.json(notFound("category not found"), { status: 404 });
    const input = (await request.json()) as { monthlyLimitAmount?: number };
    if (typeof input?.monthlyLimitAmount !== "number") {
      return HttpResponse.json({ code: 400, message: "monthlyLimitAmount is required" }, { status: 400 });
    }
    category.monthlyLimitAmount = input.monthlyLimitAmount;
    return HttpResponse.json(withUsage(category));
  }),

  http.patch("/api/categories/:categoryId", async ({ params, request }) => {
    const category = categories.find((c) => c.id === params.categoryId);
    if (!category) return HttpResponse.json(notFound("category not found"), { status: 404 });
    const input = (await request.json()) as { name?: string };
    if (!input?.name) {
      return HttpResponse.json({ code: 400, message: "name is required" }, { status: 400 });
    }
    category.name = input.name;
    return HttpResponse.json(withUsage(category));
  }),

  http.delete("/api/categories/:categoryId", ({ params }) => {
    const before = categories.length;
    categories = categories.filter((c) => c.id !== params.categoryId);
    return before === categories.length
      ? HttpResponse.json(notFound("category not found"), { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),

  // --- expenses ------------------------------------------------------------
  http.get("/api/expenses", ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    let matching = [...expenses].sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1));
    if (categoryId) matching = matching.filter((e) => e.categoryId === categoryId);
    if (from) matching = matching.filter((e) => e.expenseDate >= from);
    if (to) matching = matching.filter((e) => e.expenseDate <= to);

    return HttpResponse.json({
      count: matching.length,
      next: null,
      previous: null,
      data: matching.slice(offset, offset + limit),
    });
  }),

  http.post("/api/expenses", async ({ request }) => {
    const input = (await request.json()) as {
      categoryId?: string;
      amount?: number;
      currency?: string;
      expenseDate?: string;
      note?: string | null;
    };
    if (!input?.categoryId || typeof input.amount !== "number" || !input.currency || !input.expenseDate) {
      return HttpResponse.json(
        { code: 400, message: "categoryId, amount, currency and expenseDate are required" },
        { status: 400 },
      );
    }
    const created: Expense = {
      id: newId("exp"),
      categoryId: input.categoryId,
      enteredByMemberId: "mock-household-member",
      originalAmount: input.amount,
      originalCurrency: input.currency,
      homeAmount: toHomeAmount(input.amount, input.currency),
      homeCurrency: HOME_CURRENCY,
      expenseDate: input.expenseDate,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    };
    expenses = [created, ...expenses];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/expenses/:expenseId", async ({ params, request }) => {
    const expense = expenses.find((e) => e.id === params.expenseId);
    if (!expense) return HttpResponse.json(notFound("expense not found"), { status: 404 });
    const input = (await request.json()) as {
      categoryId?: string;
      amount?: number;
      currency?: string;
      expenseDate?: string;
      note?: string | null;
    };
    if (!input?.categoryId || typeof input.amount !== "number" || !input.currency || !input.expenseDate) {
      return HttpResponse.json(
        { code: 400, message: "categoryId, amount, currency and expenseDate are required" },
        { status: 400 },
      );
    }
    expense.categoryId = input.categoryId;
    expense.originalAmount = input.amount;
    expense.originalCurrency = input.currency;
    expense.homeAmount = toHomeAmount(input.amount, input.currency);
    expense.expenseDate = input.expenseDate;
    expense.note = input.note ?? null;
    return HttpResponse.json(expense);
  }),

  http.delete("/api/expenses/:expenseId", ({ params }) => {
    const before = expenses.length;
    expenses = expenses.filter((e) => e.id !== params.expenseId);
    return before === expenses.length
      ? HttpResponse.json(notFound("expense not found"), { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),

  // --- totals ---------------------------------------------------------------
  http.get("/api/totals", ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") as "day" | "week" | "month" | null;
    const date = url.searchParams.get("date") ?? undefined;
    if (!period || !["day", "week", "month"].includes(period)) {
      return HttpResponse.json({ code: 400, message: "period must be day, week or month" }, { status: 400 });
    }
    const inPeriod = expensesIn(period, date);
    const total = Math.round(inPeriod.reduce((sum, e) => sum + e.homeAmount, 0) * 100) / 100;
    const byCategoryMap = new Map<string, number>();
    for (const e of inPeriod) {
      byCategoryMap.set(e.categoryId, (byCategoryMap.get(e.categoryId) ?? 0) + e.homeAmount);
    }
    const byCategory = [...byCategoryMap.entries()].map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? categoryId,
      amount: Math.round(amount * 100) / 100,
    }));
    return HttpResponse.json({ period, homeCurrency: HOME_CURRENCY, total, byCategory });
  }),
];
