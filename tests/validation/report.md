# Validation report

- **Issue:** #7
- **Commit:** fea80348ebe12ab53db2d2e8d33b03cc50ec976f
- **Generated:** 2026-09-10T09:20:38.300Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 24 | 24 | 0 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A household member can sign in through the platform's sign-in flow | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | An unauthenticated visitor cannot view the shared expense data | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | A household member can create an expense with amount, category, and date | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A household member can add an optional note to an expense | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-002-c | Creating an expense without a required field (amount, category, or date) is rejected | ✅ pass | `tests/e2e/specs/AC-002-c.spec.ts` | — |
| AC-003-a | A household member can edit an expense entered by the other household member | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | A household member can delete an expense entered by the other household member | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | An expense cannot be created without a category | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | An expense's category can be changed after creation | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | A household member can create a new category | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-005-b | A household member can rename an existing category | ✅ pass | `tests/e2e/specs/AC-005-b.spec.ts` | — |
| AC-005-c | A household member can remove a category | ✅ pass | `tests/e2e/specs/AC-005-c.spec.ts` | — |
| AC-006-a | The dashboard shows a total for today's expenses | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | The dashboard shows a total for the current calendar week (Monday-Sunday) | ✅ pass | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-006-c | The dashboard shows a total for the current calendar month | ✅ pass | `tests/e2e/specs/AC-006-c.spec.ts` | — |
| AC-007-a | A per-category spending breakdown is shown for a selected period | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | The per-category breakdown updates when a new expense is added to that category | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | A household member can set a monthly spending limit on a category | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | A household member can update an existing category's spending limit | ✅ pass | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | Each category shows the amount used against its limit for the current calendar month | ✅ pass | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-009-b | A category whose spending exceeds its limit is visibly flagged as over limit | ✅ pass | `tests/e2e/specs/AC-009-b.spec.ts` | — |
| AC-010-a | An expense can be entered in a currency other than the household's home currency | ✅ pass | `tests/e2e/specs/AC-010-a.spec.ts` | — |
| AC-010-b | A foreign-currency expense is converted to the home currency and included in totals and category usage in that currency | ✅ pass | `tests/e2e/specs/AC-010-b.spec.ts` | — |
| AC-010-c | The original amount and currency entered remain visible on the expense | ✅ pass | `tests/e2e/specs/AC-010-c.spec.ts` | — |

## Manual checklist

- [ ] **AC-009-c** — Category limit usage resets at the start of each calendar month

