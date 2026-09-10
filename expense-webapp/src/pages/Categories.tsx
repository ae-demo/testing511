import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import { Chip, PageContent, PageTitle, ListingTable, Button } from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { expenseApi, USER_ID_HEADER } from "../api";
import { formatAmount } from "../lib/format";
import type { components } from "../generated/expense-api";

type Category = components["schemas"]["Category"];

export default function Categories(): JSX.Element {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void expenseApi.GET("/categories", { params: { header: USER_ID_HEADER, query: { limit: 100 } } }).then((res) => {
      if (!cancelled) setCategories(res.data?.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Categories</PageTitle.Header>
        <PageTitle.SubHeader>Manage categories and their monthly limits</PageTitle.SubHeader>
        <PageTitle.Actions>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/categories/new")}>
            New category
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Category</ListingTable.Cell>
              <ListingTable.Cell>Monthly limit</ListingTable.Cell>
              <ListingTable.Cell>Used this month</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {(categories ?? []).map((category) => {
              const usage = category.currentMonthUsage ?? 0;
              const hasLimit = category.monthlyLimitAmount != null;
              const overLimit = hasLimit && usage > category.monthlyLimitAmount!;
              return (
                <ListingTable.Row
                  key={category.id}
                  clickable
                  onClick={() => navigate(`/categories/${category.id}`, { state: { category } })}
                >
                  <ListingTable.Cell>{category.name}</ListingTable.Cell>
                  <ListingTable.Cell>{hasLimit ? formatAmount(category.monthlyLimitAmount!) : "—"}</ListingTable.Cell>
                  <ListingTable.Cell>{formatAmount(usage)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    {!hasLimit ? (
                      <Chip label="No limit set" size="small" />
                    ) : overLimit ? (
                      <Chip label="Over limit" color="error" size="small" />
                    ) : (
                      <Chip label="On track" color="success" size="small" />
                    )}
                  </ListingTable.Cell>
                </ListingTable.Row>
              );
            })}
          </ListingTable.Body>
        </ListingTable>
        {categories && categories.length === 0 && (
          <ListingTable.EmptyState
            title="No categories yet"
            description="Create a category to start tracking spending against a limit."
            action={
              <Button variant="contained" onClick={() => navigate("/categories/new")}>
                New category
              </Button>
            }
          />
        )}
      </ListingTable.Container>
    </PageContent>
  );
}
