import { useEffect, useState, type FormEvent, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Form,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Button,
} from "@wso2/oxygen-ui";
import { expenseApi, USER_ID_HEADER } from "../api";
import type { components } from "../generated/expense-api";

type Category = components["schemas"]["Category"];

export default function CategoryDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();

  const [category, setCategory] = useState<Category | null>(
    (location.state as { category?: Category } | null)?.category ?? null,
  );
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(!isNew && !category);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || category || !id) return;
    let cancelled = false;
    // expense-api has no get-one operation; a direct link resolves the
    // category from one bulk list call instead.
    void expenseApi.GET("/categories", { params: { header: USER_ID_HEADER, query: { limit: 100 } } }).then((res) => {
      if (cancelled) return;
      const found = res.data?.data.find((c) => c.id === id);
      if (found) setCategory(found);
      else setNotFound(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew, category]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setLimit(category.monthlyLimitAmount != null ? String(category.monthlyLimitAmount) : "");
    }
  }, [category]);

  const usage = category?.currentMonthUsage ?? 0; // schema does not mark this required
  const limitValue = category?.monthlyLimitAmount ?? null;
  const overLimit = limitValue != null && usage > limitValue;
  const usagePercent = limitValue ? Math.min(100, Math.round((usage / limitValue) * 100)) : 0;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const parsedLimit = limit.trim() === "" ? null : Number(limit);
      if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit < 0)) {
        setError("Enter a valid monthly limit.");
        return;
      }

      let categoryId = category?.id;

      if (isNew) {
        const res = await expenseApi.POST("/categories", {
          params: { header: USER_ID_HEADER },
          body: { name },
        });
        if (res.error || !res.data) {
          setError(res.error?.message ?? "Could not create the category.");
          return;
        }
        categoryId = res.data.id;
      } else if (category && name !== category.name) {
        const res = await expenseApi.PATCH("/categories/{categoryId}", {
          params: { header: USER_ID_HEADER, path: { categoryId: category.id } },
          body: { name },
        });
        if (res.error) {
          setError(res.error.message ?? "Could not rename the category.");
          return;
        }
      }

      if (categoryId && parsedLimit !== null) {
        const res = await expenseApi.PUT("/categories/{categoryId}/limit", {
          params: { header: USER_ID_HEADER, path: { categoryId } },
          body: { monthlyLimitAmount: parsedLimit },
        });
        if (res.error) {
          setError(res.error.message ?? "Could not set the monthly limit.");
          return;
        }
      }

      navigate("/categories");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <Alert severity="error" sx={{ maxWidth: 480 }}>
        This category could not be found.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <Card sx={{ maxWidth: 480 }}>
        <CardHeader title="Category" />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Form.Section>
            <Stack spacing={2}>
              <TextField label="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
              <TextField
                label="Monthly limit (home currency)"
                type="number"
                inputProps={{ step: "0.01", min: 0 }}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              {!isNew && limitValue != null && (
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={usagePercent}
                    color={overLimit ? "error" : "primary"}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {usagePercent}%
                  </Typography>
                </Box>
              )}
              {overLimit && <Chip label="Over limit" color="error" sx={{ alignSelf: "flex-start" }} />}
            </Stack>
          </Form.Section>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate("/categories")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </form>
  );
}
