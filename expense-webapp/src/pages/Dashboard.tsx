import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Grid,
  PageContent,
  PageTitle,
  Typography,
  ListingTable,
  Button,
} from "@wso2/oxygen-ui";
import { BarChart } from "@wso2/oxygen-ui-charts-react";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { expenseApi, USER_ID_HEADER } from "../api";
import { currentUser } from "../auth";
import { formatAmount, formatShortDate, todayIsoDate } from "../lib/format";
import type { components } from "../generated/expense-api";

type Expense = components["schemas"]["Expense"];

interface Stat {
  label: string;
  value: string;
  caption: string;
}

export default function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [chartData, setChartData] = useState<Array<{ category: string; amount: number }>>([]);
  const [recent, setRecent] = useState<Expense[] | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [selfId, setSelfId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const today = todayIsoDate();
        const [dayRes, weekRes, monthRes, todayExpensesRes, categoriesRes, recentRes, user] = await Promise.all([
          expenseApi.GET("/totals", { params: { header: USER_ID_HEADER, query: { period: "day" } } }),
          expenseApi.GET("/totals", { params: { header: USER_ID_HEADER, query: { period: "week" } } }),
          expenseApi.GET("/totals", { params: { header: USER_ID_HEADER, query: { period: "month" } } }),
          expenseApi.GET("/expenses", {
            params: { header: USER_ID_HEADER, query: { from: today, to: today, limit: 1 } },
          }),
          expenseApi.GET("/categories", { params: { header: USER_ID_HEADER, query: { limit: 100 } } }),
          expenseApi.GET("/expenses", { params: { header: USER_ID_HEADER, query: { limit: 5 } } }),
          currentUser(),
        ]);
        if (cancelled) return;

        const day = dayRes.data;
        const week = weekRes.data;
        const month = monthRes.data;
        const categories = categoriesRes.data?.data ?? [];
        const budget = categories.reduce((sum, c) => sum + (c.monthlyLimitAmount ?? 0), 0);
        const expenseCount = todayExpensesRes.data?.count ?? 0;

        setStats([
          {
            label: "Today",
            value: day ? formatAmount(day.total) : "—",
            caption: `${expenseCount} expense${expenseCount === 1 ? "" : "s"}`,
          },
          { label: "This Week", value: week ? formatAmount(week.total) : "—", caption: "Mon-Sun" },
          {
            label: "This Month",
            value: month ? formatAmount(month.total) : "—",
            caption: budget > 0 ? `vs ${formatAmount(budget)} budget` : "no category limits set",
          },
        ]);

        setChartData(
          (month?.byCategory ?? []).map((c) => ({ category: c.categoryName, amount: c.amount })),
        );

        setCategoryNames(Object.fromEntries(categories.map((c) => [c.id, c.name])));
        setRecent(recentRes.data?.data ?? []);
        setSelfId(user?.profile?.sub ?? null);
      } catch {
        if (!cancelled) setLoadError("Could not load dashboard data.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dashboard</PageTitle.Header>
        <PageTitle.SubHeader>Household spending at a glance</PageTitle.SubHeader>
      </PageTitle>

      {loadError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {loadError}
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {(stats ?? [
          { label: "Today", value: "…", caption: "" },
          { label: "This Week", value: "…", caption: "" },
          { label: "This Month", value: "…", caption: "" },
        ]).map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h4">{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.caption}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Spending by category (this month)
          </Typography>
          <BarChart
            data={chartData}
            xAxisDataKey="category"
            bars={[{ dataKey: "amount", name: "Amount" }]}
            height={260}
          />
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent expenses
      </Typography>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Date</ListingTable.Cell>
              <ListingTable.Cell>Category</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Entered by</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {(recent ?? []).map((expense) => (
              <ListingTable.Row
                key={expense.id}
                clickable
                onClick={() => navigate(`/expenses/${expense.id}`, { state: { expense } })}
              >
                <ListingTable.Cell>{formatShortDate(expense.expenseDate)}</ListingTable.Cell>
                <ListingTable.Cell>{categoryNames[expense.categoryId] ?? expense.categoryId}</ListingTable.Cell>
                <ListingTable.Cell>{formatAmount(expense.homeAmount)}</ListingTable.Cell>
                <ListingTable.Cell>
                  {expense.enteredByMemberId && expense.enteredByMemberId === selfId ? "You" : "Household member"}
                </ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {recent && recent.length === 0 && (
          <ListingTable.EmptyState title="No expenses yet" description="Add your first expense to see it here." />
        )}
      </ListingTable.Container>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/add-expense")}>
          Add expense
        </Button>
      </Box>
    </PageContent>
  );
}
