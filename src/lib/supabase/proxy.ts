import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseConfig } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Refreshes the Supabase auth session on every request and returns the
 * response carrying any updated auth cookies, plus whether a user is signed in.
 * Used by src/proxy.ts. This is an optimistic check for redirects only; pages
 * and server actions still verify the user themselves.
 */
export async function updateSupabaseSession(request: NextRequest, config: SupabaseConfig) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  return { response, isSignedIn: Boolean(data?.claims?.sub) };
}
