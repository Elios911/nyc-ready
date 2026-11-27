import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const metadata: Metadata = { title: "Set up your plan" };

export default async function OnboardingPage() {
  const repository = await getRepository();
  const profile = await repository.getProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">Step 1 of 1 · about 2 minutes</p>
        <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set your starting point</h1>
        <p className="text-sm text-muted-foreground">
          Only take-home pay is required. Everything else is optional and you can change it any time in My Profile.
        </p>
      </div>
      <Card>
        <CardContent>
          <ProfileForm profile={profile} mode="onboarding" />
        </CardContent>
      </Card>
    </div>
  );
}
