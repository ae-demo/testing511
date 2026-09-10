import { type RouteProps } from "react-router";
import AppLayout from "../layouts/AppLayout";
import AuthGate from "../layouts/AuthGate";
import Callback from "../pages/Callback";
import Dashboard from "../pages/Dashboard";
import AddExpense from "../pages/AddExpense";
import ExpenseDetail from "../pages/ExpenseDetail";
import Categories from "../pages/Categories";
import CategoryDetail from "../pages/CategoryDetail";

export interface AppRoute extends Omit<RouteProps, "children"> {
  children?: AppRoute[];
  label?: string;
}

// `/callback` is reached mid-redirect, before AuthGate has a session to show
// — it stays outside the gate so the OIDC round trip can complete.
const appRoutes: AppRoute[] = [
  { path: "/callback", element: <Callback />, label: "Callback" },
  {
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    children: [
      { path: "/", element: <Dashboard />, label: "Dashboard" },
      { path: "/add-expense", element: <AddExpense />, label: "Add Expense" },
      { path: "/expenses/:id", element: <ExpenseDetail />, label: "Expense Detail" },
      { path: "/categories", element: <Categories />, label: "Categories" },
      { path: "/categories/new", element: <CategoryDetail />, label: "New Category" },
      { path: "/categories/:id", element: <CategoryDetail />, label: "Category Detail" },
    ],
  },
];

export default appRoutes;
