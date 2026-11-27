import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoModeNotice } from "@/components/auth/demo-mode-notice";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Start your NYC plan</h1>
        <p className="text-sm text-muted-foreground">Free while in early access. Your plan is private to your account.</p>
      </div>
      {isDemoMode() ? <DemoModeNotice /> : <SignUpForm />}
    </div>
  );
}
