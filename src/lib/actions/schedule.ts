"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { expandScheduleInput, getRepository } from "@/lib/data";
import { scheduleBlockSchema, type ScheduleBlockFormValues } from "@/lib/validation/schedule";
import { failure, validationFailure, type ActionResult } from "./result";

const idSchema = z.string().min(1).max(100);

export async function createScheduleBlocks(values: ScheduleBlockFormValues): Promise<ActionResult> {
  const parsed = scheduleBlockSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  const records = expandScheduleInput(parsed.data);
  try {
    const repository = await getRepository();
    const scenario = await repository.getPrimaryScenario();
    await repository.createScheduleBlocks(scenario.id, records);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: records.length > 1 ? `Added “${parsed.data.title}” to ${records.length} days.` : `Added “${parsed.data.title}”.` };
}

export async function updateScheduleBlock(id: string, values: ScheduleBlockFormValues): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = scheduleBlockSchema.safeParse(values);
  if (!parsedId.success) return { ok: false, error: "Invalid activity." };
  if (!parsed.success) return validationFailure(parsed.error);
  const [record, ...extra] = expandScheduleInput(parsed.data);
  if (!record || extra.length > 0) return { ok: false, error: "Pick exactly one day when editing an activity.", fieldErrors: { days: "Pick exactly one day" } };
  try {
    const repository = await getRepository();
    await repository.updateScheduleBlock(parsedId.data, record);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Activity updated." };
}

export async function deleteScheduleBlock(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid activity." };
  try {
    const repository = await getRepository();
    await repository.deleteScheduleBlock(parsedId.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Activity removed." };
}
