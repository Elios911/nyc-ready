import { z } from "zod";
import { categoryGroupsForItemType, getCategory, topLevelCategoryId } from "@/lib/domain/categories";
import { BUDGET_ITEM_TYPES, FREQUENCIES } from "@/lib/domain/types";
import { optionalText, requiredMoney } from "./fields";

export const budgetItemSchema = z
  .object({
    name: z.string().trim().min(1, "Give this item a name").max(120),
    itemType: z.enum(BUDGET_ITEM_TYPES),
    categoryId: z.string().refine((id) => Boolean(getCategory(id)), "Choose a category"),
    amount: requiredMoney,
    frequency: z.enum(FREQUENCIES),
    notes: optionalText(500),
    costItemId: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .superRefine((value, ctx) => {
    const isOneTime = value.frequency === "one_time";
    if (value.itemType === "relocation" && !isOneTime) {
      ctx.addIssue({ code: "custom", path: ["frequency"], message: "Relocation costs are one-time" });
    }
    if (value.itemType !== "relocation" && isOneTime) {
      ctx.addIssue({
        code: "custom",
        path: ["frequency"],
        message: "One-time costs belong under relocation costs; choose a recurring frequency",
      });
    }
    if (!categoryGroupsForItemType(value.itemType).includes(topLevelCategoryId(value.categoryId))) {
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "This category doesn't fit this type of item" });
    }
  });

export type BudgetItemFormValues = z.input<typeof budgetItemSchema>;
export type BudgetItemInput = z.output<typeof budgetItemSchema>;
