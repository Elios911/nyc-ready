"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data";
import { onboardingSchema, profileSchema, type OnboardingFormValues, type ProfileFormValues } from "@/lib/validation/profile";
import { failure, validationFailure, type ActionResult } from "./result";

export async function saveProfile(values: ProfileFormValues): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const repository = await getRepository();
    await repository.updateProfile(parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function completeOnboarding(values: OnboardingFormValues): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const repository = await getRepository();
    await repository.updateProfile(parsed.data, { completeOnboarding: true });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
