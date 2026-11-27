import { DEMO_CATALOG, DEMO_SOURCE } from "./demo-data";

/** SQL string literal (or null). */
function q(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Build supabase/seed.sql from the demo catalog. Kept as a pure function so a
 * unit test can check the committed seed file is up to date.
 */
export function buildSeedSql(): string {
  const lines: string[] = [
    "-- GENERATED FILE: do not edit by hand. Run `npm run db:seed:generate`.",
    "-- Source: src/lib/catalog/demo-data.ts",
    "--",
    "-- ⚠️ DEMONSTRATION DATA. These are illustrative prices, not real or current",
    "-- market prices. Every observation is flagged is_demo = true and uses the",
    "-- 'demo' source type so the app always labels it \"Demo data\".",
    "",
    "insert into public.data_sources (slug, name, source_type, source_url, description, geographic_scope, limitations, refresh_interval_days) values",
    `  (${[DEMO_SOURCE.id, DEMO_SOURCE.name, DEMO_SOURCE.sourceType, DEMO_SOURCE.sourceUrl, DEMO_SOURCE.description, DEMO_SOURCE.geographicScope, DEMO_SOURCE.limitations, DEMO_SOURCE.refreshIntervalDays].map(q).join(", ")})`,
    "on conflict (slug) do nothing;",
    "",
    "insert into public.cost_items (slug, name, description, category_id, brand, unit, package_size) values",
    DEMO_CATALOG.map(({ item }) =>
      `  (${[item.slug, item.name, item.description, item.categoryId, item.brand, item.unit, item.packageSize].map(q).join(", ")})`,
    ).join(",\n"),
    "on conflict (slug) do nothing;",
    "",
    "-- Only insert demo observations once, so re-running the seed does not duplicate history.",
    "insert into public.price_observations (cost_item_id, data_source_id, merchant_name, location, price_cents, package_quantity, observed_at, price_type, confidence_level, is_demo)",
    "select ci.id, ds.id, v.merchant_name, v.location, v.price_cents, v.package_quantity, v.observed_at::timestamptz, 'demo', 'low', true",
    "from (values",
    DEMO_CATALOG.flatMap(({ item, prices }) =>
      prices.map((p) => `  (${[item.slug, p.merchantName, p.location, p.priceCents, p.packageQuantity, p.observedAt].map(q).join(", ")})`),
    ).join(",\n"),
    ") as v(item_slug, merchant_name, location, price_cents, package_quantity, observed_at)",
    "join public.cost_items ci on ci.slug = v.item_slug",
    `join public.data_sources ds on ds.slug = ${q(DEMO_SOURCE.id)}`,
    "where not exists (select 1 from public.price_observations po where po.data_source_id = ds.id);",
    "",
  ];
  return lines.join("\n");
}
