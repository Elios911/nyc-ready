import { z } from "zod";
import { LIFESTYLE_PREFERENCES, LIVING_ARRANGEMENTS } from "@/lib/domain/types";
import { optionalDate, optionalInt, optionalMoney, optionalText, requiredMoney } from "./fields";

const neighborhoods = z
  .string()
  .max(300, "Keep this under 300 characters")
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 10),
  );

const profileFields = {
  fullName: optionalText(120),
  expectedMoveDate: optionalDate,
  annualGrossIncome: optionalMoney,
  monthlyTakeHomeIncome: optionalMoney,
  currentSavings: optionalMoney,
  householdSize: optionalInt(1, 12, "Household size"),
  livingArrangement: z.union([z.enum(LIVING_ARRANGEMENTS), z.literal("")]).transform((value) => (value === "" ? null : value)),
  preferredNeighborhoods: neighborhoods,
  workLocation: optionalText(200),
  commuteDaysPerWeek: optionalInt(0, 7, "Commute days"),
  lifestylePreferences: z.array(z.enum(LIFESTYLE_PREFERENCES)).max(LIFESTYLE_PREFERENCES.length),
};

/** Full profile form (My Profile page). */
export const profileSchema = z.object(profileFields);

/**
 * Onboarding collects only the essentials. Take-home pay is required because
 * every budget calculation starts from it; everything else can come later.
 */
export const onboardingSchema = z.object({
  ...profileFields,
  monthlyTakeHomeIncome: requiredMoney,
});

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileSchema>;
export type OnboardingFormValues = z.input<typeof onboardingSchema>;
