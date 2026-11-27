"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { budgetItemSchema, type BudgetItemFormValues } from "@/lib/validation/budget";
import { failure, validationFailure, type ActionResult } from "./result";

const idSchema = z.string().min(1).max(100);

export async function createBudgetItem(values: BudgetItemFormValues): Promise<ActionResult> {
  const parsed = budgetItemSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const repository = await getRepository();
    const scenario = await repository.getPrimaryScenario();
    await repository.createBudgetItem(scenario.id, parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `Added “${parsed.data.name}” to your budget.` };
}

export async function updateBudgetItem(id: string, values: BudgetItemFormValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = budgetItemSchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: "Invalid item." };
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const repository = await getRepository();
    await repository.updateBudgetItem(parsedId.data, parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Budget item updated." };
}

export async function deleteBudgetItem(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid item." };
  try {
    const repository = await getRepository();
    await repository.deleteBudgetItem(parsedId.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Budget item removed." };
}
