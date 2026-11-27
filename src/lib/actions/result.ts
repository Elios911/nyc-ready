import type { z } from "zod";
import { NotFoundError } from "@/lib/data/repository";

/** What every Server Action returns. Forms show `error` and `fieldErrors`. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function validationFailure(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

/** Convert unexpected errors into a safe message. Framework redirects are re-thrown. */
export function failure(error: unknown, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  if (isRedirectError(error)) throw error;
  if (error instanceof NotFoundError) return { ok: false, error: "That item no longer exists. Refresh the page and try again." };
  console.error("[action]", error);
  return { ok: false, error: error instanceof Error && error.message.startsWith("Could not") ? error.message : fallback };
}

function isRedirectError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

/** Only allow same-site relative redirects (blocks "//evil.com" and absolute URLs). */
export function safeNextPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
