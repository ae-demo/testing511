import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client dbClient = check new (
    host = expenseDbHost,
    username = expenseDbUser,
    password = expenseDbPassword,
    database = expenseDbName,
    port = expenseDbPort
);

// Row shapes read straight off the tables — snake_case fields bound to the
// exact DB column names, per the JSON/DB-mapping exception to camelCase.
type CategoryRow record {|
    string id;
    string name;
|};

type CategoryLimitRow record {|
    string categoryId;
    decimal monthlyLimitAmount;
|};

type UsageRow record {|
    decimal usage;
|};

type ExpenseRow record {|
    string id;
    string categoryId;
    string enteredByMemberId;
    decimal originalAmount;
    string originalCurrency;
    decimal homeAmount;
    string homeCurrency;
    string expenseDate;
    string? note;
    string createdAt;
|};

type CountRow record {|
    int total;
|};

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS category_limits (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL UNIQUE,
            monthly_limit_amount NUMERIC NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            entered_by_member_id TEXT NOT NULL,
            original_amount NUMERIC NOT NULL,
            original_currency TEXT NOT NULL,
            home_amount NUMERIC NOT NULL,
            home_currency TEXT NOT NULL,
            expense_date TEXT NOT NULL,
            note TEXT,
            created_at TEXT NOT NULL
        )
    `);
    return;
}

final () dbReady = check initDb();
