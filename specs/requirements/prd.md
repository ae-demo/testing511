# Household Expense Tracker — PRD

## Problem Statement

Tracking day-to-day household spending across two people is hard with generic
tools: expenses go unrecorded in the moment, spending is not broken down by
category, and there is no easy way to see how spending trends daily, weekly,
or monthly, or whether a category is running over budget. Today this is either
not tracked at all or scattered across notes and bank statements, so the
household finds out it overspent only after the fact.

## Solution

A shared expense-tracking web application for a household of two. Either
person signs in and logs an expense in seconds, assigns it to a category, and
sees the household's combined spending sliced by day, week, and month, and by
category. Each category carries a spending limit so the household can see, at
a glance, how close it is to (or over) its budget.

## Actors

- **Household Member**: either person in the household. Signs in, adds/edits/
deletes expenses, views all household spending (daily/weekly/monthly and
per-category), manages expense categories, and sets/updates category
spending limits. Both household members have identical permissions — there
is no owner/admin distinction; all expense data is shared, not personal.

## User Stories

1. As a household member, I want to sign in to the application, so that only
my household can access our shared expense data.
2. As a household member, I want to quickly add an expense with an amount,
category, date, and optional note, so that logging spending takes seconds.
3. As a household member, I want to edit or delete any expense in the shared
ledger, so that either of us can correct a mistake regardless of who
entered it.
4. As a household member, I want to assign every expense to a category, so
that our spending is organized into meaningful groups.
5. As a household member, I want to create, rename, and remove expense
categories, so that the categories match how we actually spend.
6. As a household member, I want to view total expenditure for today, the
current week, and the current month, so that I can see our spending at a
glance over different timeframes.
7. As a household member, I want to see a breakdown of spending by category
for a selected period, so that I know which categories consume the most
of our budget.
8. As a household member, I want to set a spending limit for each category,
so that we have a budget target to track against.
9. As a household member, I want to see how much of each category's limit
has been used for the current period, including when a category is over
its limit, so that we can adjust our spending before it gets out of hand.

## Product Decisions

- Sign-in: household members authenticate via the platform's single sign-on
(Thunder), shared by the organization's default for every web app.
- Data model: a single shared household ledger — every expense is visible to
and editable by both household members; there is no per-person private
data.
- Permissions: both household members are equal peers with identical
capabilities; there is no owner/admin role.
- Category limits reset every calendar month (limit usage is tracked against
the current calendar month).
- Weekly totals use the calendar week (Monday–Sunday).
- The application tracks a single household currency; multi-currency
support is not needed. *assumed*
- Limit status is shown in-app (e.g. a progress indicator per category); no
external notification (email/SMS) is sent when a category nears or exceeds
its limit.

## Out of Scope

- Multi-currency support.
- Receipt/photo attachments for expenses.
- Bank account linking or automatic transaction import.
- Multi-household support (this application serves a single household).
- Exporting expense data (e.g. CSV/PDF export).
- Recurring/scheduled expenses.

## Open Questions

(none — all decisions needed to build the product are settled above, several
under an `*assumed*` tag that the household can override.)