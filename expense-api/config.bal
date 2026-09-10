import ballerina/os;

// Reads a platform-injected environment variable by name, falling back to a
// sensible default so the service always starts with no REQUIRED env vars.
function envOrDefault(string envKey, string defaultValue) returns string {
    string value = os:getEnv(envKey);
    if value == "" {
        return defaultValue;
    }
    return value;
}

function envOrDefaultInt(string envKey, int defaultValue) returns int {
    string value = os:getEnv(envKey);
    if value == "" {
        return defaultValue;
    }
    int|error parsed = int:fromString(value);
    if parsed is int {
        return parsed;
    }
    return defaultValue;
}

// expense-db (platform-resource, postgres-cnpg) — envBindings from design.json.
configurable string expenseDbHost = envOrDefault("EXPENSE_DB_HOST", "localhost");
configurable int expenseDbPort = envOrDefaultInt("EXPENSE_DB_PORT", 5432);
configurable string expenseDbUser = envOrDefault("EXPENSE_DB_USER", "postgres");
configurable string expenseDbPassword = envOrDefault("EXPENSE_DB_PASSWORD", "postgres");
configurable string expenseDbName = envOrDefault("EXPENSE_DB_DBNAME", "expense_api");

// currency-service (external dependency, Open Exchange Rates) — envBindings from design.json.
// Empty/unset in this environment until the credential is provisioned; conversion
// of a foreign-currency expense degrades to a 400 while it is empty (see currency.bal).
configurable string openExchangeRatesAppId = envOrDefault("OPEN_EXCHANGE_RATES_APP_ID", "");

// Household-wide home currency setting — no dedicated endpoint in openapi.yaml
// (a PRD "assumed" decision), so it is a single configurable env var here.
configurable string homeCurrency = envOrDefault("HOME_CURRENCY", "USD");
