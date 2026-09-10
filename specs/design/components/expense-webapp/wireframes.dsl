screen Dashboard "Household spending at a glance"
  navbar "Expense Tracker"
  sidebar "Dashboard -> Dashboard | Add Expense -> AddExpense | Categories -> Categories"
  row
    card "Today | 42.50 | 3 expenses"
    card "This Week | 218.90 | Mon-Sun"
    card "This Month | 940.10 | vs 1200 budget"
  chart "Spending by category (this month)" 600x260
  heading "Recent expenses"
  table "Date | Category | Amount | Entered by" -> ExpenseDetail
    row "Sep 10 | Groceries | 54.20 | You"
    row "Sep 9 | Utilities | 120.00 | Spouse"
    row "Sep 8 | Dining | 32.40 | You"
  button "Add expense" primary -> AddExpense

screen AddExpense "Log a new expense"
  navbar "Expense Tracker"
  sidebar "Dashboard -> Dashboard | Add Expense -> AddExpense | Categories -> Categories"
  card "New expense"
    input "Amount"
    select "Currency"
    select "Category"
    input "Date"
    textarea "Note (optional)"
    row
      right
      button "Cancel" -> Dashboard
      button "Save expense" primary -> Dashboard

screen ExpenseDetail "Edit or remove an expense"
  navbar "Expense Tracker"
  sidebar "Dashboard -> Dashboard | Add Expense -> AddExpense | Categories -> Categories"
  card "Expense details"
    text "Original: 120.00 USD"
    text "Converted: 108.30 EUR (home currency)"
    select "Category"
    input "Date"
    textarea "Note"
    row
      right
      button "Delete" danger -> Dashboard
      button "Save changes" primary -> Dashboard

screen Categories "Manage categories and their monthly limits"
  navbar "Expense Tracker"
  sidebar "Dashboard -> Dashboard | Add Expense -> AddExpense | Categories -> Categories"
  row
    right
    button "New category" primary -> CategoryDetail
  table "Category | Monthly limit | Used this month | Status" -> CategoryDetail
    row "Groceries | 400.00 | 312.50 | On track"
    row "Utilities | 200.00 | 220.00 | Over limit"
    row "Dining | 150.00 | 98.00 | On track"

screen CategoryDetail "Set a category's monthly limit"
  navbar "Expense Tracker"
  sidebar "Dashboard -> Dashboard | Add Expense -> AddExpense | Categories -> Categories"
  card "Category"
    input "Category name"
    input "Monthly limit (home currency)"
    progress "78%"
    badge "Over limit" danger
    row
      right
      button "Cancel" -> Categories
      button "Save" primary -> Categories

flow "Log an expense"
  role "Household Member"
  description "A household member logs a same- or foreign-currency expense and sees updated totals"
  Dashboard
  AddExpense
  ExpenseDetail

flow "Manage category limits"
  role "Household Member"
  description "A household member reviews category usage against limits and updates a limit"
  Categories
  CategoryDetail
