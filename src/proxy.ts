import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/constants";
import { getSupabaseConfig } from "@/lib/env";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/** Routes that require a signed-in user (or an active demo session). */
const PROTECTED_PREFIXES = ["/dashboard", "/budget", "/planner", "/explore", "/profile", "/settings", "/onboarding"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  const { pathname, search } = request.nextUrl;

  let response = NextResponse.next({ request });
  let isSignedIn: boolean;

  if (config) {
    const result = await updateSupabaseSession(request, config);
    response = result.response;
    isSignedIn = result.isSignedIn;
  } else {
    isSignedIn = request.cookies.has(DEMO_SESSION_COOKIE);
  }

  if (!isSignedIn && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
