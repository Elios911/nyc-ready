import type { Cents } from "@/lib/domain/types";

/**
 * Provider-independent catalog types. The UI only ever sees these shapes, so
 * it never needs to know whether a price came from Supabase, an official API,
 * a CSV import, a user submission or the bundled demo data.
 */

export const SOURCE_TYPES = [
  "official", // e.g. a transit agency's published fares
  "licensed_provider", // a paid / contracted data feed
  "public_dataset", // government or open data
  "curated_manual", // entered or imported (CSV) by an administrator
  "user_submission", // reported by NYC Ready users
  "demo", // illustrative data bundled for development
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const PRICE_TYPES = [
  "verified_observation", // someone saw this price at this place and time
  "provider_estimate", // a provider's typical / starting price or an average
  "user_submitted", // reported by a user, not verified
  "demo", // illustrative only, never real market data
] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export interface DataSource {
  id: string;
  name: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  description: string | null;
  geographicScope: string | null;
  limitations: string | null;
  /** How often the source is expected to be refreshed; drives freshness labels. */
  refreshIntervalDays: number | null;
}

export interface CostItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  brand: string | null;
  /** The unit prices are compared in, e.g. "gallon", "lb", "dozen", "month". */
  unit: string;
  /** Typical package size in `unit`s, e.g. 0.5 for a half-gallon. */
  packageSize: number | null;
  productIdentifier: string | null;
  imageUrl: string | null;
}

export interface PriceObservation {
  id: string;
  costItemId: string;
  dataSourceId: string;
  merchantName: string | null;
  /** Where the price applies: a store, a neighborhood, a borough or "NYC". */
  location: string | null;
  priceCents: Cents;
  currency: "USD";
  /** Quantity (in the item's unit) the price buys. Unit price = price ÷ quantity. */
  packageQuantity: number | null;
  observedAt: string; // ISO timestamp
  verifiedAt: string | null;
  priceType: PriceType;
  confidenceLevel: ConfidenceLevel;
  expiresAt: string | null;
  isDemo: boolean;
}

/** One searchable catalog entry: an item plus its most recent price per merchant/source. */
export interface CatalogEntry {
  item: CostItem;
  prices: Array<PriceObservation & { source: DataSource }>;
}

export const SORT_OPTIONS = ["relevance", "name", "price_asc", "price_desc", "unit_price", "freshness"] as const;
export type CatalogSort = (typeof SORT_OPTIONS)[number];

export interface CatalogQuery {
  search?: string;
  /** A top-level or child category ID. */
  categoryId?: string;
  priceType?: PriceType;
  sort?: CatalogSort;
}

/**
 * The contract every catalog backend implements. Add a new backend (e.g. an
 * official API mirrored into Supabase) by implementing this interface, then
 * select it in `getCatalogProvider()`.
 */
export interface CatalogProvider {
  readonly kind: "supabase" | "demo";
  search(query: CatalogQuery): Promise<CatalogEntry[]>;
  getEntry(costItemId: string): Promise<CatalogEntry | null>;
  listSources(): Promise<DataSource[]>;
}
