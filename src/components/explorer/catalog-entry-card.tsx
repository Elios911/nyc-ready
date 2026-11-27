import { Plus } from "lucide-react";
import { BudgetItemDialog, type BudgetItemDraft } from "@/components/budget/budget-item-dialog";
import { CategoryIconTile } from "@/components/finance/category-icon";
import { PriceDisplay } from "@/components/finance/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { describePrice } from "@/lib/catalog/freshness";
import type { CatalogEntry } from "@/lib/catalog/types";
import { getCategory, topLevelCategoryId } from "@/lib/domain/categories";

/** Suggest how a catalog price becomes a budget line (the user can change everything). */
function draftFromEntry(entry: CatalogEntry): BudgetItemDraft {
  const cheapest = [...entry.prices].sort((a, b) => a.priceCents - b.priceCents)[0];
  const { unit, categoryId, name } = entry.item;
  const isSubscription = unit === "month" || unit === "year";
  const group = topLevelCategoryId(categoryId);
  const label = cheapest ? describePrice(cheapest, cheapest.source).label : null;
  return {
    name,
    itemType: isSubscription ? "fixed" : "variable",
    // Allowances are usually per top-level group (e.g. "Groceries"), so planner spending can be matched to them.
    categoryId: isSubscription ? categoryId : group,
    amountCents: cheapest?.priceCents,
    frequency: unit === "year" ? "yearly" : isSubscription ? "monthly" : "weekly",
    costItemId: entry.item.id,
    notes: cheapest ? `From Cost Explorer: ${cheapest.merchantName ?? cheapest.source.name}${label ? ` (${label})` : ""}` : "",
  };
}

export function CatalogEntryCard({ entry, now }: { entry: CatalogEntry; now: Date }) {
  const category = getCategory(entry.item.categoryId);
  return (
    <Card className="gap-4" data-testid="catalog-entry">
      <div className="flex items-start gap-3 px-5">
        <CategoryIconTile categoryId={entry.item.categoryId} />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="leading-tight font-semibold">{entry.item.name}</h2>
          <p className="text-sm text-muted-foreground">
            {category?.name}
            {entry.item.brand ? ` · ${entry.item.brand}` : ""}
            {entry.item.description ? ` · ${entry.item.description}` : ""}
          </p>
        </div>
        <BudgetItemDialog
          draft={draftFromEntry(entry)}
          trigger={
            <Button variant="outline" size="sm" aria-label={`Add ${entry.item.name} to budget`}>
              <Plus />
              <span className="hidden sm:inline">Add to budget</span>
            </Button>
          }
        />
      </div>
      <CardContent className="space-y-2">
        {entry.prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prices recorded for this item yet.</p>
        ) : (
          entry.prices.map((price) => <PriceDisplay key={price.id} item={entry.item} price={price} now={now} />)
        )}
      </CardContent>
    </Card>
  );
}
