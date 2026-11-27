"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { deleteDemoState, resetDemoState, type DemoStart } from "@/lib/data/demo-store";
import { getDataMode, getSiteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/validation/auth";
import { safeNextPath, validationFailure, type ActionResult } from "./result";

const NOT_CONFIGURED: ActionResult<never> = {
  ok: false,
  error: "Accounts aren't available because Supabase isn't configured. Use the demo instead.",
};

export async function signIn(values: SignInValues, next?: string): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (error) return { ok: false, error: error.code === "email_not_confirmed" ? "Please confirm your email first. Check your inbox." : "Email or password is incorrect." };
  redirect(safeNextPath(next));
}

export async function signUp(values: SignUpValues): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName ?? "" },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    console.error("[auth] sign up failed", error.message);
    return { ok: false, error: error.code === "weak_password" ? "Please choose a stronger password." : "We couldn't create your account. Please try again." };
  }
  if (data.session) redirect("/onboarding"); // email confirmation disabled in Supabase
  return { ok: true, message: "Check your email to confirm your account, then sign in." };
}

export async function signOut(): Promise<void> {
  const session = await getSession();
  if (session?.mode === "demo") {
    deleteDemoState(session.demoSessionId);
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }
  redirect("/");
}

/** Start (or restart) a demo session. Only available when Supabase is not configured. */
export async function startDemo(start: DemoStart = "example"): Promise<void> {
  if (getDataMode() !== "demo") redirect("/login");
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
    sessionId = crypto.randomUUID();
    cookieStore.set(DEMO_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  resetDemoState(sessionId, start);
  redirect(start === "blank" ? "/onboarding" : "/dashboard");
}
