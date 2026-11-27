import "server-only";
import type {
  CostItemRow,
  DataSourceRow,
  PriceObservationRow,
} from "@/lib/supabase/database.types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { childCategories } from "@/lib/domain/categories";
import { applyCatalogQuery } from "./query";
import type {
  CatalogEntry,
  CatalogProvider,
  ConfidenceLevel,
  CostItem,
  DataSource,
  PriceObservation,
  PriceType,
  SourceType,
} from "./types";

const MAX_RESULTS = 200;

function toCostItem(row: CostItemRow): CostItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    brand: row.brand,
    unit: row.unit,
    packageSize: row.package_size === null ? null : Number(row.package_size),
    productIdentifier: row.product_identifier,
    imageUrl: row.image_url,
  };
}

function toSource(row: DataSourceRow): DataSource {
  return {
    id: row.id,
    name: row.name,
    sourceType: row.source_type as SourceType,
    sourceUrl: row.source_url,
    description: row.description,
    geographicScope: row.geographic_scope,
    limitations: row.limitations,
    refreshIntervalDays: row.refresh_interval_days,
  };
}

function toObservation(row: PriceObservationRow): PriceObservation {
  return {
    id: row.id,
    costItemId: row.cost_item_id,
    dataSourceId: row.data_source_id,
    merchantName: row.merchant_name,
    location: row.location,
    priceCents: Number(row.price_cents),
    currency: "USD",
    packageQuantity: row.package_quantity === null ? null : Number(row.package_quantity),
    observedAt: row.observed_at,
    verifiedAt: row.verified_at,
    priceType: row.price_type as PriceType,
    confidenceLevel: row.confidence_level as ConfidenceLevel,
    expiresAt: row.expires_at,
    isDemo: row.is_demo,
  };
}

/** Escape LIKE wildcards in user input. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * Reads the catalog from Supabase: cost_items + latest_price_observations +
 * data_sources. SQL narrows by category and search text; shared in-memory
 * logic (`applyCatalogQuery`) does ranking and sorting so results match demo mode.
 */
export function createSupabaseCatalogProvider(supabase: SupabaseServerClient): CatalogProvider {
  async function loadEntries(items: CostItemRow[]): Promise<CatalogEntry[]> {
    if (items.length === 0) return [];
    const [observations, sources] = await Promise.all([
      supabase
        .from("latest_price_observations")
        .select("*")
        .in(
          "cost_item_id",
          items.map((item) => item.id),
        ),
      supabase.from("data_sources").select("*"),
    ]);
    if (observations.error || sources.error) {
      console.error("[catalog] failed to load prices", observations.error?.message ?? sources.error?.message);
      throw new Error("Could not load prices. Please try again.");
    }
    const sourceById = new Map(sources.data.map((row) => [row.id, toSource(row)]));
    return items.map((row) => ({
      item: toCostItem(row),
      prices: observations.data
        .filter((obs) => obs.cost_item_id === row.id && sourceById.has(obs.data_source_id))
        .map((obs) => ({ ...toObservation(obs), source: sourceById.get(obs.data_source_id)! })),
    }));
  }

  return {
    kind: "supabase",
    async search(query) {
      let request = supabase.from("cost_items").select("*").limit(MAX_RESULTS);
      if (query.categoryId) {
        const ids = [query.categoryId, ...childCategories(query.categoryId).map((c) => c.id)];
        request = request.in("category_id", ids);
      }
      const firstTerm = query.search?.trim().split(/\s+/)[0];
      if (firstTerm) {
        // Broad SQL prefilter on the first term; applyCatalogQuery enforces all terms.
        const term = `%${escapeLike(firstTerm)}%`;
        request = request.or(`name.ilike.${term},description.ilike.${term},brand.ilike.${term}`);
      }
      const { data, error } = await request;
      if (error) {
        console.error("[catalog] search failed", error.message);
        throw new Error("Could not search the catalog. Please try again.");
      }
      return applyCatalogQuery(await loadEntries(data), query);
    },
    async getEntry(costItemId) {
      const { data, error } = await supabase.from("cost_items").select("*").eq("id", costItemId).maybeSingle();
      if (error || !data) return null;
      const [entry] = await loadEntries([data]);
      return entry ?? null;
    },
    async listSources() {
      const { data, error } = await supabase.from("data_sources").select("*").order("name");
      if (error) throw new Error("Could not load data sources.");
      return data.map(toSource);
    },
  };
}
