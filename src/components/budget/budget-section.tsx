import { Pencil, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { CategoryIconTile } from "@/components/finance/category-icon";
import { Money } from "@/components/finance/money";
import { ConfirmDeleteButton } from "@/components/form/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteBudgetItem } from "@/lib/actions/budget";
import { getCategory } from "@/lib/domain/categories";
import { FREQUENCY_UNIT, type BudgetItem, type BudgetItemType } from "@/lib/domain/types";
import { toMonthlyCents } from "@/lib/finance/frequency";
import { BudgetItemDialog } from "./budget-item-dialog";

/** A titled list of budget items of one type, with add/edit/delete. */
export function BudgetSection({
  title,
  description,
  itemType,
  items,
  totalCents,
  totalLabel,
  addLabel,
  emptyText,
  leadingRow,
}: {
  title: string;
  description: string;
  itemType: BudgetItemType;
  items: BudgetItem[];
  totalCents: number;
  totalLabel: string;
  addLabel: string;
  emptyText: string;
  leadingRow?: ReactNode;
}) {
  return (
    <Card data-testid={`budget-section-${itemType}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <BudgetItemDialog
            draft={{ itemType }}
            lockType
            trigger={
              <Button variant="outline" size="sm">
                <Plus />
                {addLabel}
              </Button>
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        {leadingRow}
        {items.length === 0 && !leadingRow ? <p className="py-3 text-sm text-muted-foreground">{emptyText}</p> : null}
        <ul className="divide-y">
          {items.map((item) => {
            const monthly = toMonthlyCents(item.amountCents, item.frequency);
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <CategoryIconTile categoryId={item.categoryId} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getCategory(item.categoryId)?.name ?? "Other"}
                    {item.costItemId ? " · from Cost Explorer" : ""}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    <Money cents={item.amountCents} compact />
                    {item.frequency !== "monthly" && item.frequency !== "one_time" ? (
                      <span className="font-normal text-muted-foreground"> / {FREQUENCY_UNIT[item.frequency]}</span>
                    ) : null}
                  </p>
                  {item.frequency !== "monthly" && item.frequency !== "one_time" ? (
                    <p className="text-xs text-muted-foreground">
                      ≈ <Money cents={monthly} compact /> / month
                    </p>
                  ) : item.frequency === "one_time" ? (
                    <Badge variant="secondary" className="mt-0.5">One-time</Badge>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <BudgetItemDialog
                    item={item}
                    lockType
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.name}`}>
                        <Pencil />
                      </Button>
                    }
                  />
                  <ConfirmDeleteButton label={item.name} onDelete={deleteBudgetItem.bind(null, item.id)} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">{totalLabel}</span>
          <Money cents={totalCents} className="font-semibold" />
        </div>
      </CardContent>
    </Card>
  );
}
