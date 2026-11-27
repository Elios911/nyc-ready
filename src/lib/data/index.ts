import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DemoRepository } from "./demo-repository";
import type { PlanRepository } from "./repository";
import { SupabaseRepository } from "./supabase-repository";

/**
 * The repository for the current request's user. Redirects to /login if
 * nobody is signed in. This is the ONLY way pages and actions should get one.
 */
export const getRepository = cache(async (): Promise<PlanRepository> => {
  const session = await requireSession();
  if (session.mode === "demo") return new DemoRepository(session.demoSessionId);
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  return new SupabaseRepository(supabase, session.userId);
});

export { NotFoundError, expandScheduleInput, type PlanRepository } from "./repository";
