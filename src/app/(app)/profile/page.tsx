import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const repository = await getRepository();
  const profile = await repository.getProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your financial starting point. Budgets are calculated from take-home pay, not salary before tax."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <ProfileForm profile={profile} mode="full" />
        </CardContent>
      </Card>
    </div>
  );
}
