import ballerina/sql;
import ballerina/uuid;

function getCategoryRow(string categoryId) returns CategoryRow?|error {
    CategoryRow|sql:Error result = dbClient->queryRow(`
        SELECT id, name FROM categories WHERE id = ${categoryId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result;
}

function categoryExists(string categoryId) returns boolean|error {
    CategoryRow? row = check getCategoryRow(categoryId);
    return row is CategoryRow;
}

function getCategoryLimitAmount(string categoryId) returns decimal?|error {
    CategoryLimitRow|sql:Error result = dbClient->queryRow(`
        SELECT category_id AS "categoryId", monthly_limit_amount AS "monthlyLimitAmount"
        FROM category_limits WHERE category_id = ${categoryId}
    `);
    if result is sql:NoRowsError {
        return ();
    }
    if result is sql:Error {
        return result;
    }
    return result.monthlyLimitAmount;
}

// Category limit usage: summed from the expenses themselves against the
// current calendar month, computed against the database's own "now" — never
// a stored counter that needs resetting.
function currentMonthUsage(string categoryId) returns decimal|error {
    UsageRow row = check dbClient->queryRow(`
        SELECT COALESCE(SUM(home_amount), 0) AS usage FROM expenses
        WHERE category_id = ${categoryId}
        AND expense_date::date >= date_trunc('month', CURRENT_DATE)::date
        AND expense_date::date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date
    `);
    return row.usage;
}

function toCategory(CategoryRow row) returns Category|error {
    decimal? 'limit = check getCategoryLimitAmount(row.id);
    decimal usage = check currentMonthUsage(row.id);
    return {
        id: row.id,
        name: row.name,
        monthlyLimitAmount: 'limit,
        currentMonthUsage: usage
    };
}

function listCategoriesPage(int limitVal, int offsetVal) returns record {| int count; Category[] data; |}|error {
    CountRow countRow = check dbClient->queryRow(`SELECT COUNT(*)::int AS total FROM categories`);
    stream<CategoryRow, sql:Error?> rowStream = dbClient->query(`
        SELECT id, name FROM categories ORDER BY name LIMIT ${limitVal} OFFSET ${offsetVal}
    `);
    Category[] data = [];
    check from CategoryRow row in rowStream
        do {
            Category category = check toCategory(row);
            data.push(category);
        };
    return {count: countRow.total, data: data};
}

function createCategoryRecord(string name) returns Category|error {
    string id = uuid:createType4AsString();
    _ = check dbClient->execute(`INSERT INTO categories (id, name) VALUES (${id}, ${name})`);
    return {id: id, name: name, monthlyLimitAmount: (), currentMonthUsage: 0d};
}

function updateCategoryRecord(string categoryId, string name) returns Category?|error {
    CategoryRow? existing = check getCategoryRow(categoryId);
    if existing is () {
        return ();
    }
    _ = check dbClient->execute(`UPDATE categories SET name = ${name} WHERE id = ${categoryId}`);
    CategoryRow updated = {id: categoryId, name: name};
    return toCategory(updated);
}

function deleteCategoryRecord(string categoryId) returns boolean|error {
    CategoryRow? existing = check getCategoryRow(categoryId);
    if existing is () {
        return false;
    }
    _ = check dbClient->execute(`DELETE FROM category_limits WHERE category_id = ${categoryId}`);
    _ = check dbClient->execute(`DELETE FROM categories WHERE id = ${categoryId}`);
    return true;
}

function setCategoryLimitRecord(string categoryId, decimal amount) returns Category?|error {
    CategoryRow? existing = check getCategoryRow(categoryId);
    if existing is () {
        return ();
    }
    string id = uuid:createType4AsString();
    _ = check dbClient->execute(`
        INSERT INTO category_limits (id, category_id, monthly_limit_amount)
        VALUES (${id}, ${categoryId}, ${amount})
        ON CONFLICT (category_id) DO UPDATE SET monthly_limit_amount = ${amount}
    `);
    return toCategory(existing);
}
