# Validation test plan — Household Expense Tracker

Target: `expense-webapp` (primary, UI) and `expense-api` (API, via the
`request` fixture). Sign-in is Thunder OIDC Authorization Code + PKCE — no
resource-owner-password grant is available, so even API-only criteria log
in once through the browser (`lib/auth.ts: loginAsHouseholdMember`) and then
read the access token out of `localStorage` to call `expense-api` directly.

Only one role exists (`Household Member`, cold-start) and the roles gate
ticket (#3) publishes exactly one test user (`test-household-member`). REQ-003
("either household member can edit/delete any expense... regardless of who
entered it") is written against two people; with a single provisioned
account, AC-003-a/b are exercised as "the signed-in member can edit/delete an
expense without being blocked by who is recorded as `enteredByMemberId`" —
the closest honest proxy available, noted here rather than silently assumed.

The deployed environment is shared and not reset between runs (confirmed
live: expense/category rows existed from outside this session). Every spec
creates its own uniquely-named category/expense (`` `E2E ${Date.now()}` ``)
and reads totals as **deltas** around its own action rather than assuming a
clean starting state.

## AC-001-a — A household member can sign in through the platform's sign-in flow

- Target: expense-webapp (primary)
- Steps:
  1. Navigate to `/` unauthenticated
  2. Observe redirect to the Thunder "Sign In" gate
  3. Fill Username/Password from `AEP_E2E_USERNAME`/`AEP_E2E_PASSWORD`, click "Sign In"
- Assert: redirected back to the app and the "Dashboard" heading is visible
- Source: live explore (thunder.<cluster>/gate/signin form, `getByRole('textbox', {name:'Username'})` / `'Password'` / `getByRole('button',{name:'Sign In'})`)

## AC-001-b — An unauthenticated visitor cannot view the shared expense data

- Target: expense-api (primary for the assertion)
- Steps:
  1. `GET /expenses` with no `Authorization` header
- Assert: `401`
- Source: confirmed live via curl (`{"error":"Unauthorized","message":"Authentication failed."}`, HTTP 401)

## AC-002-a — A household member can create an expense with amount, category, and date

- Target: expense-webapp
- Steps:
  1. Log in
  2. Create a category (unique name)
  3. Go to "Add Expense", fill Amount, Currency=USD, Category, Date; Save
  4. Dashboard: "Recent expenses" table
- Assert: a row with that category name and formatted amount is visible
- Source: live explore of AddExpense.tsx + Dashboard.tsx

## AC-002-b — A household member can add an optional note to an expense

- Target: expense-webapp
- Steps:
  1. Log in, create category, create expense with a Note filled in
  2. Open the expense's detail page
- Assert: the Note textbox contains the entered text
- Source: live explore of ExpenseDetail.tsx (Note textbox)

## AC-002-c — Creating an expense without a required field (amount, category, or date) is rejected

- Target: expense-api
- Steps:
  1. `POST /expenses` with `categoryId`+`currency`+`expenseDate` but no `amount`
- Assert: `400`
- Source: confirmed live via curl (`data binding failed: required field 'amount' not present`)

## AC-003-a — A household member can edit an expense entered by the other household member

- Target: expense-webapp
- Steps:
  1. Log in, create category + expense
  2. Open its detail page, change the Note, Save
  3. Reopen the expense
- Assert: the updated Note is shown (edit succeeds; not blocked by `enteredByMemberId`)
- Source: live explore of ExpenseDetail.tsx `handleSave`
- Limitation: single test account provisioned — see plan header

## AC-003-b — A household member can delete an expense entered by the other household member

- Target: expense-webapp
- Steps:
  1. Log in, create category + expense
  2. Open its detail page, click "Delete"
  3. Dashboard "Recent expenses"
- Assert: the deleted expense's note/amount no longer appears
- Source: live explore of ExpenseDetail.tsx `handleDelete`
- Limitation: single test account provisioned — see plan header

## AC-004-a — An expense cannot be created without a category

- Target: expense-api
- Steps:
  1. `POST /expenses` with `amount`+`currency`+`expenseDate` but no `categoryId`
- Assert: `400`
- Source: confirmed live via curl (`required field 'categoryId' not present`)

## AC-004-b — An expense's category can be changed after creation

- Target: expense-webapp
- Steps:
  1. Log in, create two categories (A, B)
  2. Create an expense in category A
  3. Open its detail page, change Category select to B, Save
  4. Reopen the expense
- Assert: category shown is now B
- Source: live explore of ExpenseDetail.tsx category `<select>`

## AC-005-a — A household member can create a new category

- Target: expense-webapp
- Steps:
  1. Log in, go to Categories, click "New category", fill name, Save
- Assert: the new category row appears in the Categories table
- Source: live explore of CategoryDetail.tsx / Categories.tsx

## AC-005-b — A household member can rename an existing category

- Target: expense-webapp
- Steps:
  1. Log in, create a category
  2. Open it, change the name, Save
- Assert: Categories table shows the new name, not the old one
- Source: live explore (CategoryDetail `handleSave` PATCHes name)

## AC-005-c — A household member can remove a category

- Target: expense-api (the webapp has no delete affordance for categories — confirmed by reading `Categories.tsx`/`CategoryDetail.tsx`, no "Delete" control exists there, unlike expenses)
- Steps:
  1. Log in (for a token), create a category via UI/API
  2. `DELETE /categories/{id}`
  3. `GET /categories`
- Assert: delete returns `204` and the category is absent from the list
- Source: openapi.yaml `deleteCategory`; confirmed live via curl

## AC-006-a — The dashboard shows a total for today's expenses

- Target: expense-webapp
- Steps:
  1. Log in, read the "Today" card value
  2. Create a category + a USD expense dated today with a known amount
  3. Reload Dashboard, read "Today" card value again
- Assert: new value = old value + amount (±0.01)
- Source: live explore (Dashboard "Today" stat card)

## AC-006-b — The dashboard shows a total for the current calendar week (Monday-Sunday)

- Target: expense-webapp
- Steps: same delta pattern against the "This Week" card
- Assert: new value = old value + amount (±0.01)
- Source: live explore (Dashboard "This Week" stat card)

## AC-006-c — The dashboard shows a total for the current calendar month

- Target: expense-webapp
- Steps: same delta pattern against the "This Month" card
- Assert: new value = old value + amount (±0.01)
- Source: live explore (Dashboard "This Month" stat card)

## AC-007-a — A per-category spending breakdown is shown for a selected period

- Target: expense-webapp
- Steps:
  1. Log in, create a uniquely-named category, add a USD expense to it
  2. Go to Categories page
- Assert: that category's row shows "Used this month" equal to the expense amount
- Source: live explore (Categories.tsx `currentMonthUsage` column) — the app's
  period selection is fixed to "this month" (no picker control in Dashboard.tsx
  or Categories.tsx), so "selected period" = the current calendar month

## AC-007-b — The per-category breakdown updates when a new expense is added to that category

- Target: expense-webapp
- Steps:
  1. Continue from AC-007-a's category, note "Used this month"
  2. Add a second USD expense to the same category
  3. Reload Categories page
- Assert: "Used this month" increased by the second expense's amount
- Source: live explore

## AC-008-a — A household member can set a monthly spending limit on a category

- Target: expense-webapp
- Steps:
  1. Log in, create a category with no limit
  2. Open it, fill "Monthly limit (home currency)", Save
- Assert: Categories table shows that limit for the category (not "—")
- Source: live explore (CategoryDetail limit field -> `setCategoryLimit`)

## AC-008-b — A household member can update an existing category's spending limit

- Target: expense-webapp
- Steps:
  1. Continue from a category with a limit set
  2. Open it, change the limit value, Save
- Assert: Categories table shows the new limit
- Source: live explore

## AC-009-a — Each category shows the amount used against its limit for the current calendar month

- Target: expense-webapp
- Steps:
  1. Log in, create a category with a limit, add an expense under the limit
  2. Go to Categories page
- Assert: row shows both the limit and "Used this month" reflecting the expense
- Source: live explore (Categories.tsx columns: "Monthly limit", "Used this month")

## AC-009-b — A category whose spending exceeds its limit is visibly flagged as over limit

- Target: expense-webapp
- Steps:
  1. Log in, create a category with a small limit (e.g. 10)
  2. Add an expense exceeding it (e.g. 50 USD)
  3. Go to Categories page
- Assert: that row shows an "Over limit" chip
- Source: live explore (Categories.tsx `overLimit` -> Chip label="Over limit" color="error")

## AC-010-a — An expense can be entered in a currency other than the household's home currency

- Target: expense-webapp
- Steps:
  1. Log in, create a category
  2. Add Expense: set Currency to EUR (home currency is USD — confirmed via
     `expense-api/config.bal` default and live totals `"homeCurrency":"USD"`), Save
- Assert: expense is created without error (redirects to Dashboard, appears in Recent expenses)
- Source: live explore (AddExpense.tsx Currency `<select>`, `CURRENCY_CODES`)

## AC-010-b — A foreign-currency expense is converted to the home currency and included in totals and category usage in that currency

- Target: expense-api
- Steps:
  1. Log in (token), create a category
  2. `POST /expenses` with `currency: "EUR"`, read `homeAmount`/`homeCurrency` from the response
  3. `GET /categories`, find the category
- Assert: response `homeCurrency` is `"USD"` and `homeAmount` differs from `originalAmount` (real conversion, not pass-through — confirmed live: 100 EUR -> 116.39 USD); category's `currentMonthUsage` includes that `homeAmount`
- Source: confirmed live via curl

## AC-010-c — The original amount and currency entered remain visible on the expense

- Target: expense-webapp
- Steps:
  1. Log in, create a category, add an expense with Currency=EUR
  2. Open its detail page
- Assert: "Original: <amount> EUR" text is visible, and it differs from the "Converted: ... USD" text
- Source: live explore of ExpenseDetail.tsx ("Original: {originalAmount} {originalCurrency}")

## AC-009-c (manual) — Category limit usage resets at the start of each calendar month

Not automated — `currentMonthUsage` is computed server-side per calendar
month; verifying a month boundary reset requires either a full month's wait
or clock manipulation not available against the live deployment. Rendered as
a manual checklist item in the report.
