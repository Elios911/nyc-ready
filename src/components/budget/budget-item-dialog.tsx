"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CategorySelect } from "@/components/finance/category-select";
import { applyServerErrors } from "@/components/form/apply-errors";
import { FormError, FormField, MoneyInputWrapper } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createBudgetItem, updateBudgetItem } from "@/lib/actions/budget";
import { categoryGroupsForItemType } from "@/lib/domain/categories";
import {
  BUDGET_ITEM_TYPE_LABELS,
  BUDGET_ITEM_TYPES,
  FREQUENCY_LABELS,
  type BudgetItem,
  type BudgetItemType,
  type Frequency,
} from "@/lib/domain/types";
import { FREQUENCY_EXPLANATIONS, toMonthlyCents } from "@/lib/finance/frequency";
import { centsToInputValue, formatCents, parseDollarsToCents } from "@/lib/finance/money";
import { budgetItemSchema, type BudgetItemFormValues } from "@/lib/validation/budget";

const RECURRING: Frequency[] = ["weekly", "monthly", "yearly"];

const DEFAULT_CATEGORY: Record<BudgetItemType, string> = {
  income: "income",
  fixed: "housing.rent",
  variable: "groceries",
  savings: "savings.emergency",
  relocation: "relocation.deposit",
};

export interface BudgetItemDraft {
  name?: string;
  itemType?: BudgetItemType;
  categoryId?: string;
  amountCents?: number;
  frequency?: Frequency;
  notes?: string;
  costItemId?: string;
}

function defaults(item: BudgetItem | undefined, draft: BudgetItemDraft | undefined): BudgetItemFormValues {
  const itemType = item?.itemType ?? draft?.itemType ?? "fixed";
  return {
    name: item?.name ?? draft?.name ?? "",
    itemType,
    categoryId: item?.categoryId ?? draft?.categoryId ?? DEFAULT_CATEGORY[itemType],
    amount: centsToInputValue(item?.amountCents ?? draft?.amountCents ?? null),
    frequency: item?.frequency ?? draft?.frequency ?? (itemType === "relocation" ? "one_time" : "monthly"),
    notes: item?.notes ?? draft?.notes ?? "",
    costItemId: item?.costItemId ?? draft?.costItemId ?? "",
  };
}

/** Add or edit a budget line. Pass `item` to edit, or `draft` to prefill a new one. */
export function BudgetItemDialog({
  item,
  draft,
  trigger,
  lockType = false,
}: {
  item?: BudgetItem;
  draft?: BudgetItemDraft;
  trigger: ReactNode;
  /** Hide the type picker (used when adding from a specific budget section). */
  lockType?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<BudgetItemFormValues>({ resolver: zodResolver(budgetItemSchema, undefined, { raw: true }), defaultValues: defaults(item, draft) });
  const { errors } = form.formState;

  const [itemType, frequency, amount] = useWatch({ control: form.control, name: ["itemType", "frequency", "amount"] });
  const amountCents = parseDollarsToCents(amount);
  const monthly = amountCents !== null && frequency !== "one_time" ? toMonthlyCents(amountCents, frequency) : null;

  function changeType(next: BudgetItemType) {
    form.setValue("itemType", next);
    form.setValue("categoryId", DEFAULT_CATEGORY[next]);
    form.setValue("frequency", next === "relocation" ? "one_time" : frequency === "one_time" ? "monthly" : frequency);
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = item ? await updateBudgetItem(item.id, values) : await createBudgetItem(values);
      if (!result.ok) {
        setFormError(result.error);
        applyServerErrors(result, form.setError);
        return;
      }
      toast.success(result.message ?? "Saved");
      setOpen(false);
      if (!item) form.reset(defaults(undefined, draft));
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setFormError(null);
          form.reset(defaults(item, draft));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit budget item" : "Add to budget"}</DialogTitle>
          <DialogDescription>{BUDGET_ITEM_TYPE_LABELS[itemType]}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          {lockType ? null : (
            <FormField id="itemType" label="Type" error={errors.itemType?.message}>
              <NativeSelect id="itemType" value={itemType} onChange={(event) => changeType(event.target.value as BudgetItemType)}>
                {BUDGET_ITEM_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {BUDGET_ITEM_TYPE_LABELS[value]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}
          <FormField id="name" label="Name" error={errors.name?.message}>
            <Input id="name" aria-invalid={Boolean(errors.name)} placeholder="e.g. Rent" {...form.register("name")} />
          </FormField>
          <FormField id="categoryId" label="Category" error={errors.categoryId?.message}>
            <CategorySelect id="categoryId" groups={categoryGroupsForItemType(itemType)} {...form.register("categoryId")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="amount" label="Amount" error={errors.amount?.message}>
              <MoneyInputWrapper>
                <Input id="amount" inputMode="decimal" aria-invalid={Boolean(errors.amount)} placeholder="0" {...form.register("amount")} />
              </MoneyInputWrapper>
            </FormField>
            <FormField id="frequency" label="How often" error={errors.frequency?.message}>
              {itemType === "relocation" ? (
                <Input id="frequency" value="One-time" disabled readOnly />
              ) : (
                <NativeSelect id="frequency" {...form.register("frequency")}>
                  {RECURRING.map((value) => (
                    <option key={value} value={value}>
                      {FREQUENCY_LABELS[value]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          </div>
          {monthly !== null && frequency !== "monthly" ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              ≈ <strong className="text-foreground tabular">{formatCents(monthly)}</strong> per month ({FREQUENCY_EXPLANATIONS[frequency]})
            </p>
          ) : null}
          {itemType === "variable" ? (
            <p className="text-xs text-muted-foreground">
              Allowances cover matching spending in your weekly planner, so it isn&apos;t counted twice. Only planned spending above the allowance
              is added.
            </p>
          ) : null}
          <FormField id="notes" label="Notes" optional error={errors.notes?.message}>
            <Textarea id="notes" rows={2} {...form.register("notes")} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : item ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
