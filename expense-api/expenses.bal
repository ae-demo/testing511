import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function toExpense(ExpenseRow row) returns Expense {
    return {
        id: row.id,
        categoryId: row.categoryId,
        enteredByMemberId: row.enteredByMemberId,
        originalAmount: row.originalAmount,
        originalCurrency: row.originalCurrency,
        homeAmount: row.homeAmount,
        homeCurrency: row.homeCurrency,
        expenseDate: row.expenseDate,
        note: row.note,
        createdAt: row.createdAt
    };
}

function getExpenseRow(string expenseId) returns ExpenseRow?|error {
    ExpenseRow|sql:Error result = dbClient->queryRow(`
        SELECT id, category_id AS "categoryId", entered_by_member_id AS "enteredByMemberId",
               original_amount AS "originalAmount", original_currency AS "originalCurrency",
               home_amount AS "homeAmount", home_currency AS "homeCurrency",
               expense_date AS "expenseDate", note, created_at AS "createdAt"
        FROM expenses WHERE id = ${expenseId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function listExpensesPage(string? categoryId, string? fromDate, string? toDate, int limitVal, int offsetVal)
        returns record {| int count; Expense[] data; |}|error {
    sql:ParameterizedQuery whereClause = ` WHERE 1 = 1`;
    if categoryId is string {
        whereClause = sql:queryConcat(whereClause, ` AND category_id = ${categoryId}`);
    }
    if fromDate is string {
        whereClause = sql:queryConcat(whereClause, ` AND expense_date::date >= ${fromDate}::date`);
    }
    if toDate is string {
        whereClause = sql:queryConcat(whereClause, ` AND expense_date::date <= ${toDate}::date`);
    }

    CountRow countRow = check dbClient->queryRow(sql:queryConcat(`SELECT COUNT(*)::int AS total FROM expenses`, whereClause));

    sql:ParameterizedQuery selectQuery = sql:queryConcat(`
        SELECT id, category_id AS "categoryId", entered_by_member_id AS "enteredByMemberId",
               original_amount AS "originalAmount", original_currency AS "originalCurrency",
               home_amount AS "homeAmount", home_currency AS "homeCurrency",
               expense_date AS "expenseDate", note, created_at AS "createdAt"
        FROM expenses`, whereClause, ` ORDER BY expense_date DESC, created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`);
    stream<ExpenseRow, sql:Error?> rowStream = dbClient->query(selectQuery);
    Expense[] data = [];
    check from ExpenseRow row in rowStream
        do {
            data.push(toExpense(row));
        };
    return {count: countRow.total, data: data};
}

// Validates an ExpenseInput and, on success, converts it to the home currency.
// Returns the home amount on success, or an ErrorBadRequest describing the
// first validation failure.
function validateAndConvert(ExpenseInput input) returns decimal|ErrorBadRequest|error {
    boolean categoryOk = check categoryExists(input.categoryId);
    if !categoryOk {
        return badRequest("unknown categoryId", "no category exists with id " + input.categoryId);
    }
    if input.amount <= 0d {
        return badRequest("amount must be positive");
    }
    if input.currency.trim() == "" {
        return badRequest("currency is required");
    }
    if !isValidDateString(input.expenseDate) {
        return badRequest("expenseDate must be a valid date (YYYY-MM-DD)");
    }
    decimal|string converted = convertToHomeCurrency(input.amount, input.currency);
    if converted is string {
        return badRequest("invalid input", converted);
    }
    return converted;
}

function createExpenseRecord(ExpenseInput input, string enteredByMemberId) returns Expense|ErrorBadRequest|error {
    decimal|ErrorBadRequest|error converted = validateAndConvert(input);
    if converted is ErrorBadRequest {
        return converted;
    }
    if converted is error {
        return converted;
    }
    decimal homeAmount = converted;
    string id = uuid:createType4AsString();
    string createdAt = time:utcToString(time:utcNow());
    _ = check dbClient->execute(`
        INSERT INTO expenses (id, category_id, entered_by_member_id, original_amount, original_currency,
                               home_amount, home_currency, expense_date, note, created_at)
        VALUES (${id}, ${input.categoryId}, ${enteredByMemberId}, ${input.amount}, ${input.currency},
                ${homeAmount}, ${homeCurrency}, ${input.expenseDate}, ${input?.note}, ${createdAt})
    `);
    return {
        id: id,
        categoryId: input.categoryId,
        enteredByMemberId: enteredByMemberId,
        originalAmount: input.amount,
        originalCurrency: input.currency,
        homeAmount: homeAmount,
        homeCurrency: homeCurrency,
        expenseDate: input.expenseDate,
        note: input?.note,
        createdAt: createdAt
    };
}

function updateExpenseRecord(string expenseId, ExpenseInput input) returns Expense?|ErrorBadRequest|error {
    ExpenseRow? existing = check getExpenseRow(expenseId);
    if existing is () {
        return ();
    }
    decimal|ErrorBadRequest|error converted = validateAndConvert(input);
    if converted is ErrorBadRequest {
        return converted;
    }
    if converted is error {
        return converted;
    }
    decimal homeAmount = converted;
    _ = check dbClient->execute(`
        UPDATE expenses SET category_id = ${input.categoryId}, original_amount = ${input.amount},
               original_currency = ${input.currency}, home_amount = ${homeAmount}, home_currency = ${homeCurrency},
               expense_date = ${input.expenseDate}, note = ${input?.note}
        WHERE id = ${expenseId}
    `);
    return {
        id: expenseId,
        categoryId: input.categoryId,
        enteredByMemberId: existing.enteredByMemberId,
        originalAmount: input.amount,
        originalCurrency: input.currency,
        homeAmount: homeAmount,
        homeCurrency: homeCurrency,
        expenseDate: input.expenseDate,
        note: input?.note,
        createdAt: existing.createdAt
    };
}

function deleteExpenseRecord(string expenseId) returns boolean|error {
    ExpenseRow? existing = check getExpenseRow(expenseId);
    if existing is () {
        return false;
    }
    _ = check dbClient->execute(`DELETE FROM expenses WHERE id = ${expenseId}`);
    return true;
}
