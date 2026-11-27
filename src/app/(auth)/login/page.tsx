import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DemoModeNotice } from "@/components/auth/demo-mode-notice";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue planning your move.</p>
      </div>
      {params.error === "confirmation_failed" ? (
        <p role="alert" className="rounded-md border border-negative/25 bg-negative-soft px-3 py-2 text-sm text-negative">
          That confirmation link didn&apos;t work or has expired. Try signing in, or sign up again.
        </p>
      ) : null}
      {isDemoMode() ? <DemoModeNotice /> : <SignInForm next={next} />}
    </div>
  );
}
