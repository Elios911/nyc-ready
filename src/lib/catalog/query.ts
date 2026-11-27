import { getCategory } from "@/lib/domain/categories";
import { unitPriceCents } from "./unit-price";
import type { CatalogEntry, CatalogQuery } from "./types";

/**
 * In-memory filtering/sorting shared by catalog providers. The Supabase
 * provider narrows results in SQL first and then uses this for consistent
 * ordering, so both backends behave identically in the UI.
 */

function matchesCategory(categoryId: string, filter: string): boolean {
  if (categoryId === filter) return true;
  return getCategory(categoryId)?.parentId === filter;
}

function searchScore(entry: CatalogEntry, terms: string[]): number {
  if (terms.length === 0) return 1;
  const name = entry.item.name.toLowerCase();
  const haystack = [
    entry.item.name,
    entry.item.brand ?? "",
    entry.item.description ?? "",
    getCategory(entry.item.categoryId)?.name ?? "",
    ...entry.prices.map((p) => `${p.merchantName ?? ""} ${p.location ?? ""}`),
  ]
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0; // every term must match
    score += name.startsWith(term) ? 3 : name.includes(term) ? 2 : 1;
  }
  return score;
}

/** Lowest price among an entry's observations (null when there are none). */
export function lowestPriceCents(entry: CatalogEntry): number | null {
  if (entry.prices.length === 0) return null;
  return Math.min(...entry.prices.map((p) => p.priceCents));
}

/** Lowest unit price among an entry's observations. */
export function lowestUnitPriceCents(entry: CatalogEntry): number | null {
  const values = entry.prices
    .map((p) => unitPriceCents(p.priceCents, p.packageQuantity))
    .filter((v): v is number => v !== null);
  return values.length ? Math.min(...values) : null;
}

function newestObservation(entry: CatalogEntry): number {
  if (entry.prices.length === 0) return 0;
  return Math.max(...entry.prices.map((p) => Date.parse(p.verifiedAt ?? p.observedAt) || 0));
}

const nullsLast = (a: number | null, b: number | null, direction: 1 | -1) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
};

export function applyCatalogQuery(entries: readonly CatalogEntry[], query: CatalogQuery): CatalogEntry[] {
  const terms = (query.search ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const scored = entries
    .map((entry) => {
      const prices = query.priceType ? entry.prices.filter((p) => p.priceType === query.priceType) : entry.prices;
      return { entry: { ...entry, prices }, score: searchScore(entry, terms) };
    })
    .filter(({ entry, score }) => {
      if (score === 0) return false;
      if (query.categoryId && !matchesCategory(entry.item.categoryId, query.categoryId)) return false;
      if (query.priceType && entry.prices.length === 0) return false;
      return true;
    });

  const sort = query.sort ?? "relevance";
  scored.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.entry.item.name.localeCompare(b.entry.item.name);
      case "price_asc":
        return nullsLast(lowestPriceCents(a.entry), lowestPriceCents(b.entry), 1);
      case "price_desc":
        return nullsLast(lowestPriceCents(a.entry), lowestPriceCents(b.entry), -1);
      case "unit_price":
        // Unit prices are only comparable within the same unit, so group by unit first.
        return (
          a.entry.item.unit.localeCompare(b.entry.item.unit) ||
          nullsLast(lowestUnitPriceCents(a.entry), lowestUnitPriceCents(b.entry), 1)
        );
      case "freshness":
        return newestObservation(b.entry) - newestObservation(a.entry);
      case "relevance":
      default:
        return b.score - a.score || a.entry.item.name.localeCompare(b.entry.item.name);
    }
  });

  return scored.map(({ entry }) => entry);
}
