import ballerina/sql;

type CategoryTotalRow record {|
    string categoryId;
    string categoryName;
    decimal amount;
|};

function computePeriodTotals(string period, string? dateParam) returns PeriodTotals|error {
    string dateStr = dateParam ?: todayDateString();
    DateRange range = check periodBounds(period, dateStr);

    stream<CategoryTotalRow, sql:Error?> rowStream = dbClient->query(`
        SELECT e.category_id AS "categoryId", c.name AS "categoryName",
               SUM(e.home_amount) AS amount
        FROM expenses e JOIN categories c ON c.id = e.category_id
        WHERE e.expense_date::date >= ${range.'from}::date AND e.expense_date::date <= ${range.to}::date
        GROUP BY e.category_id, c.name
        ORDER BY c.name
    `);

    PeriodTotals_byCategory[] byCategory = [];
    decimal total = 0d;
    check from CategoryTotalRow row in rowStream
        do {
            byCategory.push({categoryId: row.categoryId, categoryName: row.categoryName, amount: row.amount});
            total += row.amount;
        };

    "day"|"week"|"month" typedPeriod = <"day"|"week"|"month">period;
    return {
        period: typedPeriod,
        homeCurrency: homeCurrency,
        total: total,
        byCategory: byCategory
    };
}
