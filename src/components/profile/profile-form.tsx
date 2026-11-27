"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { applyServerErrors } from "@/components/form/apply-errors";
import { FormError, FormField, MoneyInputWrapper } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { completeOnboarding, saveProfile } from "@/lib/actions/profile";
import {
  LIFESTYLE_LABELS,
  LIFESTYLE_PREFERENCES,
  LIVING_ARRANGEMENT_LABELS,
  LIVING_ARRANGEMENTS,
  type Profile,
} from "@/lib/domain/types";
import { centsToInputValue } from "@/lib/finance/money";
import { onboardingSchema, profileSchema, type ProfileFormValues } from "@/lib/validation/profile";

export function profileToFormValues(profile: Profile): ProfileFormValues {
  return {
    fullName: profile.fullName ?? "",
    expectedMoveDate: profile.expectedMoveDate ?? "",
    annualGrossIncome: centsToInputValue(profile.annualGrossIncomeCents),
    monthlyTakeHomeIncome: centsToInputValue(profile.monthlyTakeHomeIncomeCents),
    currentSavings: centsToInputValue(profile.currentSavingsCents),
    householdSize: profile.householdSize?.toString() ?? "",
    livingArrangement: profile.livingArrangement ?? "",
    preferredNeighborhoods: profile.preferredNeighborhoods.join(", "),
    workLocation: profile.workLocation ?? "",
    commuteDaysPerWeek: profile.commuteDaysPerWeek?.toString() ?? "",
    lifestylePreferences: profile.lifestylePreferences,
  };
}

/**
 * Financial profile form. `mode="onboarding"` shows only the essentials and
 * requires take-home pay; `mode="full"` shows everything.
 */
export function ProfileForm({ profile, mode }: { profile: Profile; mode: "onboarding" | "full" }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = mode === "onboarding" ? onboardingSchema : profileSchema;
  const form = useForm<ProfileFormValues>({
    // `raw: true` validates in the browser but submits the raw strings; the server action re-validates and converts.
    resolver: zodResolver(schema, undefined, { raw: true }),
    defaultValues: profileToFormValues(profile),
  });
  const { errors } = form.formState;
  const full = mode === "full";

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = mode === "onboarding" ? await completeOnboarding(values) : await saveProfile(values);
      if (!result.ok) {
        setFormError(result.error);
        applyServerErrors(result, form.setError);
        return;
      }
      if (result.message) toast.success(result.message);
      form.reset(values);
    });
  });

  const field = (name: keyof ProfileFormValues) => ({
    id: name,
    "aria-invalid": Boolean(errors[name]),
    ...form.register(name),
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError message={formError} />

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Income & savings</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="monthlyTakeHomeIncome"
            label="Monthly take-home pay"
            optional={full}
            hint="What lands in your bank account each month after taxes and deductions. Your best estimate is fine."
            error={errors.monthlyTakeHomeIncome?.message}
          >
            <MoneyInputWrapper>
              <Input inputMode="decimal" placeholder="4,200" {...field("monthlyTakeHomeIncome")} />
            </MoneyInputWrapper>
          </FormField>
          <FormField
            id="annualGrossIncome"
            label="Annual salary before tax"
            optional
            hint="For reference only. NYC Ready doesn't calculate taxes yet, so budgets use take-home pay."
            error={errors.annualGrossIncome?.message}
          >
            <MoneyInputWrapper>
              <Input inputMode="decimal" placeholder="65,000" {...field("annualGrossIncome")} />
            </MoneyInputWrapper>
          </FormField>
          <FormField id="currentSavings" label="Current savings" optional hint="Used to check whether you can cover move-in costs." error={errors.currentSavings?.message}>
            <MoneyInputWrapper>
              <Input inputMode="decimal" placeholder="8,000" {...field("currentSavings")} />
            </MoneyInputWrapper>
          </FormField>
          <FormField id="expectedMoveDate" label="Expected move date" optional error={errors.expectedMoveDate?.message}>
            <Input type="date" {...field("expectedMoveDate")} />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Living situation</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="livingArrangement" label="How do you plan to live?" optional error={errors.livingArrangement?.message}>
            <NativeSelect {...field("livingArrangement")}>
              <option value="">Choose…</option>
              {LIVING_ARRANGEMENTS.map((value) => (
                <option key={value} value={value}>
                  {LIVING_ARRANGEMENT_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          {full ? (
            <FormField id="householdSize" label="People in your household" optional hint="Including you." error={errors.householdSize?.message}>
              <Input inputMode="numeric" placeholder="3" {...field("householdSize")} />
            </FormField>
          ) : null}
          <FormField
            id="preferredNeighborhoods"
            label="Neighborhoods you're considering"
            optional
            hint="Separate with commas, e.g. Astoria, Bushwick."
            error={errors.preferredNeighborhoods?.message}
            className={full ? undefined : "sm:col-span-1"}
          >
            <Input placeholder="Astoria, Bushwick" {...field("preferredNeighborhoods")} />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Work & commute</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="workLocation" label="Where you'll work" optional hint="An area or address, e.g. Midtown Manhattan." error={errors.workLocation?.message}>
            <Input placeholder="Midtown Manhattan" {...field("workLocation")} />
          </FormField>
          <FormField id="commuteDaysPerWeek" label="Days commuting per week" optional error={errors.commuteDaysPerWeek?.message}>
            <Input inputMode="numeric" placeholder="5" {...field("commuteDaysPerWeek")} />
          </FormField>
        </div>
      </fieldset>

      {full ? (
        <>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Lifestyle</legend>
            <p className="text-xs text-muted-foreground">Pick any that describe you. This helps you compare scenarios later.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LIFESTYLE_PREFERENCES.map((value) => (
                <label key={value} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm has-checked:border-primary/40 has-checked:bg-accent">
                  <input type="checkbox" value={value} className="size-4 accent-[var(--primary)]" {...form.register("lifestylePreferences")} />
                  {LIFESTYLE_LABELS[value]}
                </label>
              ))}
            </div>
          </fieldset>
          <FormField id="fullName" label="Your name" optional error={errors.fullName?.message}>
            <Input autoComplete="name" className="sm:max-w-sm" {...field("fullName")} />
          </FormField>
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || (full && !form.formState.isDirty)}>
          {pending ? "Saving…" : mode === "onboarding" ? "Continue to my plan" : "Save profile"}
        </Button>
        {full && form.formState.isDirty && !pending ? <span className="text-xs text-muted-foreground">You have unsaved changes</span> : null}
      </div>
    </form>
  );
}
