import { z } from "zod";

/**
 * Environment configuration. All env access goes through here.
 *
 * If NEXT_PUBLIC_SUPABASE_URL and a publishable key are set, the app runs
 * against Supabase. If neither is set, it runs in DEMO MODE (in-memory data,
 * bundled demonstration catalog). Setting only one of them is an error, so a
 * misconfigured deploy never silently falls back to demo mode.
 */

const supabaseSchema = z.object({
  url: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  publishableKey: z.string().min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short"),
});

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  // Must be referenced literally so Next.js can inline them into client bundles.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;

  if (!url && !publishableKey) return null;
  const parsed = supabaseSchema.safeParse({ url, publishableKey });
  if (!parsed.success) {
    throw new Error(
      `Supabase is partially configured: ${parsed.error.issues.map((issue) => issue.message).join("; ")}. ` +
        "Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or neither to use demo mode.",
    );
  }
  return parsed.data;
}

export type DataMode = "supabase" | "demo";

export function getDataMode(): DataMode {
  return getSupabaseConfig() ? "supabase" : "demo";
}

export function isDemoMode(): boolean {
  return getDataMode() === "demo";
}

/** Public site URL, used for auth email redirects. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}
