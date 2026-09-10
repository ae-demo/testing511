import { useEffect, useState, type FormEvent, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Form,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Button,
} from "@wso2/oxygen-ui";
import { expenseApi, USER_ID_HEADER } from "../api";
import { formatAmount } from "../lib/format";
import type { components } from "../generated/expense-api";

type Expense = components["schemas"]["Expense"];
type Category = components["schemas"]["Category"];

export default function ExpenseDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [expense, setExpense] = useState<Expense | null>((location.state as { expense?: Expense } | null)?.expense ?? null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [note, setNote] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void expenseApi
      .GET("/categories", { params: { header: USER_ID_HEADER, query: { limit: 100 } } })
      .then((res) => {
        if (!cancelled) setCategories(res.data?.data ?? []);
      });

    // expense-api has no get-one operation; a direct link (reload, typed URL)
    // resolves the expense from one bulk list call instead.
    if (!expense && id) {
      void expenseApi.GET("/expenses", { params: { header: USER_ID_HEADER, query: { limit: 100 } } }).then((res) => {
        if (cancelled) return;
        const found = res.data?.data.find((e) => e.id === id);
        if (found) setExpense(found);
        else setNotFound(true);
      });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (expense) {
      setCategoryId(expense.categoryId);
      setExpenseDate(expense.expenseDate);
      setNote(expense.note ?? "");
    }
  }, [expense]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!expense) return;
    setError(null);
    setSaving(true);
    try {
      const res = await expenseApi.PATCH("/expenses/{expenseId}", {
        params: { header: USER_ID_HEADER, path: { expenseId: expense.id } },
        body: {
          categoryId,
          amount: expense.originalAmount,
          currency: expense.originalCurrency,
          expenseDate,
          note: note || undefined,
        },
      });
      if (res.error) {
        setError(res.error.message ?? "Could not save changes.");
        return;
      }
      navigate("/");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    setError(null);
    const res = await expenseApi.DELETE("/expenses/{expenseId}", {
      params: { header: USER_ID_HEADER, path: { expenseId: expense.id } },
    });
    if (res.error) {
      setError(res.error.message ?? "Could not delete this expense.");
      return;
    }
    navigate("/");
  }

  if (notFound) {
    return (
      <Alert severity="error" sx={{ maxWidth: 560 }}>
        This expense could not be found.
      </Alert>
    );
  }

  if (!expense) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <Card sx={{ maxWidth: 560 }}>
        <CardHeader title="Expense details" />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography>
              Original: {formatAmount(expense.originalAmount)} {expense.originalCurrency}
            </Typography>
            <Typography>
              Converted: {formatAmount(expense.homeAmount)} {expense.homeCurrency} (home currency)
            </Typography>
          </Stack>

          <Form.Section>
            <Stack spacing={2}>
              <TextField
                select
                label="Category"
                value={categories.some((category) => category.id === categoryId) ? categoryId : ""}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Note" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Stack>
          </Form.Section>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" color="error" onClick={() => void handleDelete()}>
              Delete
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              Save changes
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </form>
  );
}
