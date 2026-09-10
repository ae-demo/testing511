import { type Page, expect } from "@playwright/test";

// Stat cards (Today / This Week / This Month) render as
// <Card class="MuiCard-root">...<Typography variant="overline">{label}</Typography>
// <Typography variant="h4">{value}</Typography>...</Card> — no test ids, so
// this filters the Card by its label text and reads the h4 inside it.
//
// Dashboard.tsx renders "…" placeholders in all three cards until its
// Promise.all of totals/categories/expenses resolves, so the heading is not
// numeric on first paint — wait for that placeholder to clear before reading.
export async function readStatValue(page: Page, label: "Today" | "This Week" | "This Month"): Promise<number> {
  const heading = page.locator(".MuiCard-root", { hasText: label }).getByRole("heading", { level: 4 });
  await expect(heading).not.toHaveText("…");
  const text = await heading.textContent();
  return Number(text);
}
