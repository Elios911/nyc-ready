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
import { createScheduleBlocks, deleteScheduleBlock, updateScheduleBlock } from "@/lib/actions/schedule";
import { SPENDING_GROUP_IDS } from "@/lib/domain/categories";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, DAY_LABELS, DAYS_OF_WEEK, type ActivityType, type DayOfWeek, type ScheduleBlock } from "@/lib/domain/types";
import { centsToInputValue } from "@/lib/finance/money";
import { scheduleBlockSchema, type ScheduleBlockFormValues } from "@/lib/validation/schedule";
import { ACTIVITY_DEFAULT_CATEGORY } from "./activity-style";

function defaults(block: ScheduleBlock | undefined, day: DayOfWeek | undefined): ScheduleBlockFormValues {
  return {
    title: block?.title ?? "",
    activityType: block?.activityType ?? "other",
    days: block ? [block.dayOfWeek] : day ? [day] : [],
    startTime: block?.startTime ?? "18:00",
    endTime: block?.endTime ?? "19:00",
    estimatedCost: block && block.estimatedCostCents > 0 ? centsToInputValue(block.estimatedCostCents) : "",
    categoryId: block?.categoryId ?? "",
    location: block?.location ?? "",
    notes: block?.notes ?? "",
  };
}

/** Add an activity (to one or more days) or edit an existing one. */
export function ScheduleBlockDialog({ block, day, trigger }: { block?: ScheduleBlock; day?: DayOfWeek; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ScheduleBlockFormValues>({
    resolver: zodResolver(scheduleBlockSchema, undefined, { raw: true }),
    defaultValues: defaults(block, day),
  });
  const { errors } = form.formState;
  const [days, activityType] = useWatch({ control: form.control, name: ["days", "activityType"] });

  function toggleDay(value: DayOfWeek) {
    if (block) {
      form.setValue("days", [value], { shouldDirty: true });
      return;
    }
    const next = days.includes(value) ? days.filter((d) => d !== value) : [...days, value];
    form.setValue("days", next, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  }

  function changeActivity(value: ActivityType) {
    form.setValue("activityType", value);
    if (!form.getValues("categoryId")) form.setValue("categoryId", ACTIVITY_DEFAULT_CATEGORY[value]);
    if (!form.getValues("title")) form.setValue("title", ACTIVITY_LABELS[value]);
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = block ? await updateScheduleBlock(block.id, values) : await createScheduleBlocks(values);
      if (!result.ok) {
        setFormError(result.error);
        applyServerErrors(result, form.setError);
        return;
      }
      toast.success(result.message ?? "Saved");
      setOpen(false);
    });
  });

  function onDelete() {
    if (!block) return;
    startTransition(async () => {
      const result = await deleteScheduleBlock(block.id);
      if (result.ok) {
        toast.success(result.message ?? "Removed");
        setOpen(false);
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setFormError(null);
          setConfirmingDelete(false);
          form.reset(defaults(block, day));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{block ? "Edit activity" : "Add an activity"}</DialogTitle>
          <DialogDescription>
            {block ? "Changes apply to this day only." : "Pick several days to repeat it, like a weekday commute."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="activityType" label="Activity">
              <NativeSelect id="activityType" value={activityType} onChange={(event) => changeActivity(event.target.value as ActivityType)}>
                {ACTIVITY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {ACTIVITY_LABELS[value]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="title" label="Name" error={errors.title?.message}>
              <Input id="title" placeholder="e.g. Gym" aria-invalid={Boolean(errors.title)} {...form.register("title")} />
            </FormField>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{block ? "Day" : "Days"}</legend>
            <div className="flex flex-wrap gap-1.5" role="group">
              {DAYS_OF_WEEK.map((value) => {
                const selected = days.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(value)}
                    className={
                      selected
                        ? "h-8 min-w-11 rounded-md border border-primary bg-primary px-2 text-sm font-medium text-primary-foreground"
                        : "h-8 min-w-11 rounded-md border bg-card px-2 text-sm text-muted-foreground hover:text-foreground"
                    }
                  >
                    {DAY_LABELS[value].short}
                  </button>
                );
              })}
              {!block ? (
                <button type="button" className="h-8 px-2 text-xs text-primary hover:underline" onClick={() => form.setValue("days", [1, 2, 3, 4, 5], { shouldDirty: true })}>
                  Weekdays
                </button>
              ) : null}
            </div>
            {errors.days ? <p className="text-xs text-destructive">{errors.days.message ?? "Pick at least one day"}</p> : null}
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <FormField id="startTime" label="Starts" error={errors.startTime?.message}>
              <Input id="startTime" type="time" step={300} {...form.register("startTime")} />
            </FormField>
            <FormField id="endTime" label="Ends" error={errors.endTime?.message}>
              <Input id="endTime" type="time" step={300} aria-invalid={Boolean(errors.endTime)} {...form.register("endTime")} />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="estimatedCost" label="Estimated spending" optional hint="Each time you do this." error={errors.estimatedCost?.message}>
              <MoneyInputWrapper>
                <Input id="estimatedCost" inputMode="decimal" placeholder="0" {...form.register("estimatedCost")} />
              </MoneyInputWrapper>
            </FormField>
            <FormField id="categoryId" label="Budget category" error={errors.categoryId?.message}>
              <CategorySelect id="categoryId" groups={SPENDING_GROUP_IDS} allowEmpty emptyLabel="None (no spending)" {...form.register("categoryId")} />
            </FormField>
          </div>

          <FormField id="location" label="Location" optional error={errors.location?.message}>
            <Input id="location" placeholder="e.g. Astoria" {...form.register("location")} />
          </FormField>
          <FormField id="notes" label="Notes" optional error={errors.notes?.message}>
            <Textarea id="notes" rows={2} {...form.register("notes")} />
          </FormField>

          <DialogFooter className="sm:justify-between">
            {block ? (
              confirmingDelete ? (
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" onClick={onDelete} disabled={pending}>
                    Confirm delete
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                    Keep
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : block ? "Save changes" : days.length > 1 ? `Add to ${days.length} days` : "Add activity"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
