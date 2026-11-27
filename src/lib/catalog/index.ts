import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoCatalogProvider } from "./demo-provider";
import { createSupabaseCatalogProvider } from "./supabase-provider";
import type { CatalogProvider } from "./types";

/**
 * The catalog for this request. Pages call this and never talk to a specific
 * backend directly. New sources (official APIs, licensed feeds, CSV imports)
 * are imported INTO Supabase as data_sources + price_observations, so the
 * frontend keeps using the same provider.
 */
export async function getCatalogProvider(): Promise<CatalogProvider> {
  const supabase = await createSupabaseServerClient();
  return supabase ? createSupabaseCatalogProvider(supabase) : demoCatalogProvider;
}
