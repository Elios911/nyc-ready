import { z } from "zod";
import { getCategory } from "@/lib/domain/categories";
import { ACTIVITY_TYPES, type DayOfWeek } from "@/lib/domain/types";
import { timeToMinutes } from "@/lib/finance/schedule";
import { optionalMoney, optionalText, timeOfDay } from "./fields";

const dayOfWeek = z
  .number()
  .int()
  .min(1)
  .max(7)
  .transform((day) => day as DayOfWeek);

export const scheduleBlockSchema = z
  .object({
    title: z.string().trim().min(1, "Give this activity a name").max(120),
    activityType: z.enum(ACTIVITY_TYPES),
    /** One or more days: creating a block on several days makes one block per day. */
    days: z.array(dayOfWeek).min(1, "Pick at least one day").max(7),
    startTime: timeOfDay,
    endTime: timeOfDay,
    estimatedCost: optionalMoney.transform((value) => value ?? 0),
    categoryId: z
      .string()
      .refine((id) => id === "" || Boolean(getCategory(id)), "Choose a valid category")
      .transform((value) => (value === "" ? null : value)),
    location: optionalText(200),
    notes: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (timeToMinutes(value.endTime) <= timeToMinutes(value.startTime)) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after the start time" });
    }
    if (value.estimatedCost > 0 && !value.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Pick a category so this spending can be matched to your budget",
      });
    }
  });

export type ScheduleBlockFormValues = z.input<typeof scheduleBlockSchema>;
export type ScheduleBlockInput = z.output<typeof scheduleBlockSchema>;
