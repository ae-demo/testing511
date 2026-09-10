import { useEffect, useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Form,
  MenuItem,
  Stack,
  TextField,
  Button,
} from "@wso2/oxygen-ui";
import { expenseApi, USER_ID_HEADER } from "../api";
import { CURRENCY_CODES } from "../lib/currencies";
import { todayIsoDate } from "../lib/format";
import type { components } from "../generated/expense-api";

type Category = components["schemas"]["Category"];

export default function AddExpense(): JSX.Element {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIsoDate());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void expenseApi.GET("/categories", { params: { header: USER_ID_HEADER, query: { limit: 100 } } }).then((res) => {
      if (cancelled) return;
      const data = res.data?.data ?? [];
      setCategories(data);
      if (data.length > 0) setCategoryId((current) => current || data[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }
    setSaving(true);
    try {
      const res = await expenseApi.POST("/expenses", {
        params: { header: USER_ID_HEADER },
        body: {
          categoryId,
          amount: parsedAmount,
          currency,
          expenseDate,
          note: note || undefined,
        },
      });
      if (res.error) {
        setError(res.error.message ?? "Could not save the expense.");
        return;
      }
      navigate("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Card sx={{ maxWidth: 560 }}>
        <CardHeader title="New expense" />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Form.Section>
            <Stack spacing={2}>
              <TextField
                label="Amount"
                type="number"
                inputProps={{ step: "0.01", min: 0 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <TextField select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCY_CODES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Category"
                value={categoryId}
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
              <TextField
                label="Note (optional)"
                multiline
                minRows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Stack>
          </Form.Section>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              Save expense
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </form>
  );
}
