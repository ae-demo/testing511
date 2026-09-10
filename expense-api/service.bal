import ballerina/http;

listener http:Listener ep0 = new (9090);

function clampLimit(int limitVal) returns int {
    if limitVal < 1 {
        return 1;
    }
    if limitVal > 100 {
        return 100;
    }
    return limitVal;
}

function clampOffset(int offsetVal) returns int {
    if offsetVal < 0 {
        return 0;
    }
    return offsetVal;
}

service / on ep0 {

    # List categories with current-month usage and limits
    resource function get categories(@http:Header string? X\-User\-Id, int 'limit = 20, int offset = 0)
            returns CategoryListResponse|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        int limitVal = clampLimit('limit);
        int offsetVal = clampOffset(offset);
        record {| int count; Category[] data; |} page = check listCategoriesPage(limitVal, offsetVal);
        return {
            count: page.count,
            next: nextPageUri("/categories", "", page.count, limitVal, offsetVal),
            previous: previousPageUri("/categories", "", limitVal, offsetVal),
            data: page.data
        };
    }

    # Create a category
    resource function post categories(@http:Header string? X\-User\-Id, @http:Payload CategoryInput payload)
            returns Category|ErrorBadRequest|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        if payload.name.trim() == "" {
            return badRequest("name is required");
        }
        Category category = check createCategoryRecord(payload.name);
        return category;
    }

    # Rename a category
    resource function patch categories/[string categoryId](@http:Header string? X\-User\-Id, @http:Payload CategoryInput payload)
            returns Category|ErrorNotFound|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        Category? updated = check updateCategoryRecord(categoryId, payload.name);
        if updated is () {
            return notFound("category not found");
        }
        return updated;
    }

    # Remove a category
    resource function delete categories/[string categoryId](@http:Header string? X\-User\-Id)
            returns http:NoContent|ErrorNotFound|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        boolean deleted = check deleteCategoryRecord(categoryId);
        if !deleted {
            return notFound("category not found");
        }
        return http:NO_CONTENT;
    }

    # Set or update a category's monthly spending limit
    resource function put categories/[string categoryId]/'limit(@http:Header string? X\-User\-Id, @http:Payload CategoryLimitInput payload)
            returns Category|ErrorNotFound|ErrorBadRequest|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        if payload.monthlyLimitAmount < 0d {
            return badRequest("monthlyLimitAmount must not be negative");
        }
        Category? updated = check setCategoryLimitRecord(categoryId, payload.monthlyLimitAmount);
        if updated is () {
            return notFound("category not found");
        }
        return updated;
    }

    # List household expenses, optionally filtered by category or date range
    resource function get expenses(@http:Header string? X\-User\-Id, string? categoryId, string? 'from, string? to,
            int 'limit = 20, int offset = 0) returns ExpenseListResponse|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        int limitVal = clampLimit('limit);
        int offsetVal = clampOffset(offset);
        record {| int count; Expense[] data; |} page = check listExpensesPage(categoryId, 'from, to, limitVal, offsetVal);

        string extraQuery = "";
        if categoryId is string {
            extraQuery += "&categoryId=" + categoryId;
        }
        if 'from is string {
            extraQuery += "&from=" + 'from;
        }
        if to is string {
            extraQuery += "&to=" + to;
        }

        return {
            count: page.count,
            next: nextPageUri("/expenses", extraQuery, page.count, limitVal, offsetVal),
            previous: previousPageUri("/expenses", extraQuery, limitVal, offsetVal),
            data: page.data
        };
    }

    # Log a new expense, converting to the home currency if needed
    resource function post expenses(@http:Header string? X\-User\-Id, @http:Payload ExpenseInput payload)
            returns Expense|ErrorBadRequest|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        Expense|ErrorBadRequest expense = check createExpenseRecord(payload, userId);
        return expense;
    }

    # Edit an existing expense
    resource function patch expenses/[string expenseId](@http:Header string? X\-User\-Id, @http:Payload ExpenseInput payload)
            returns Expense|ErrorNotFound|ErrorBadRequest|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        Expense?|ErrorBadRequest updated = check updateExpenseRecord(expenseId, payload);
        if updated is ErrorBadRequest {
            return updated;
        }
        if updated is () {
            return notFound("expense not found");
        }
        return updated;
    }

    # Delete an expense
    resource function delete expenses/[string expenseId](@http:Header string? X\-User\-Id)
            returns http:NoContent|ErrorNotFound|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        boolean deleted = check deleteExpenseRecord(expenseId);
        if !deleted {
            return notFound("expense not found");
        }
        return http:NO_CONTENT;
    }

    # Get household spending totals and category breakdown for a period
    resource function get totals(@http:Header string? X\-User\-Id, "day"|"week"|"month" period, string? date)
            returns PeriodTotals|ErrorBadRequest|ErrorUnauthorized|error {
        string|ErrorUnauthorized userId = requireUserId(X\-User\-Id);
        if userId is ErrorUnauthorized {
            return userId;
        }
        if date is string && !isValidDateString(date) {
            return badRequest("date must be a valid date (YYYY-MM-DD)");
        }
        PeriodTotals totals = check computePeriodTotals(period, date);
        return totals;
    }
}
