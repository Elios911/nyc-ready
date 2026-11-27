import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDataMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_SESSION_COOKIE } from "./constants";

export type AppSession =
  | { mode: "supabase"; userId: string; email: string | null }
  | { mode: "demo"; demoSessionId: string };

const DEMO_ID_PATTERN = /^[0-9a-f-]{36}$/;

/**
 * The current user, or null. Cached per request.
 * In Supabase mode the JWT is verified by `getClaims()`; never trust a user ID
 * sent from the browser.
 */
export const getSession = cache(async (): Promise<AppSession | null> => {
  if (getDataMode() === "demo") {
    const id = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
    return id && DEMO_ID_PATTERN.test(id) ? { mode: "demo", demoSessionId: id } : null;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { mode: "supabase", userId: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

/** Use in protected pages and every Server Action. Redirects to /login when signed out. */
export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
