# Domain Model

The household ledger is shared: every expense, category, and limit belongs to
the household, not to an individual member.

```mermaid
erDiagram
    HOUSEHOLD_MEMBER ||--o{ EXPENSE : logs
    CATEGORY ||--o{ EXPENSE : classifies
    CATEGORY ||--|| CATEGORY_LIMIT : has

    HOUSEHOLD_MEMBER {
        string id
        string email
        string displayName
    }
    CATEGORY {
        string id
        string name
    }
    CATEGORY_LIMIT {
        string id
        string categoryId
        decimal monthlyLimitAmount
        string homeCurrency
    }
    EXPENSE {
        string id
        string categoryId
        string enteredByMemberId
        decimal originalAmount
        string originalCurrency
        decimal homeAmount
        string homeCurrency
        date expenseDate
        string note
        datetime createdAt
    }
```

- **HOUSEHOLD\_MEMBER** is a household member's identity, resolved from the
signed-in Thunder session — not a row this app creates.
- **CATEGORY** is a household-wide grouping (e.g. Groceries, Utilities); each
has at most one **CATEGORY\_LIMIT** (a monthly cap, expressed in the
household's home currency).
- **EXPENSE** always carries both the amount as entered (`originalAmount` /
`originalCurrency`) and the converted amount used for reporting
(`homeAmount` / `homeCurrency`), so a foreign-currency entry is never lossy.

