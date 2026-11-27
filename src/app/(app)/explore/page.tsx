import { FlaskConical, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogEntryCard } from "@/components/explorer/catalog-entry-card";
import { CategoryTabs } from "@/components/explorer/category-tabs";
import { ExplorerFilters } from "@/components/explorer/explorer-filters";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";
import { getCatalogProvider } from "@/lib/catalog";
import { PRICE_TYPES, SORT_OPTIONS, type CatalogSort, type PriceType } from "@/lib/catalog/types";
import { getCategory } from "@/lib/domain/categories";

export const metadata: Metadata = { title: "Cost Explorer" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  await requireSession();
  const params = await searchParams;
  const q = first(params.q).slice(0, 100);
  const category = getCategory(first(params.category)) ? first(params.category) : "";
  const type = (PRICE_TYPES as readonly string[]).includes(first(params.type)) ? (first(params.type) as PriceType) : "";
  const sort = (SORT_OPTIONS as readonly string[]).includes(first(params.sort)) ? (first(params.sort) as CatalogSort) : "relevance";

  const catalog = await getCatalogProvider();
  const entries = await catalog.search({ search: q, categoryId: category || undefined, priceType: type || undefined, sort });
  const hasDemoPrices = entries.some((entry) => entry.prices.some((price) => price.isDemo));
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Explorer"
        description="Everyday NYC costs in one place. Every price shows its source, date, location and how reliable it is."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/explore/sources">About our data sources</Link>
          </Button>
        }
      />

      {hasDemoPrices ? (
        <Alert variant="demo">
          <FlaskConical />
          <AlertTitle>These prices are demonstration data</AlertTitle>
          <AlertDescription>
            <p>
              They&apos;re illustrative values for exploring the app, from fictional merchants, and are not real or current NYC prices. Verified
              sources will replace them before launch.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <ExplorerFilters q={q} category={category} type={type} sort={sort} />
        <CategoryTabs active={category} q={q} type={type} sort={sort} />
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {entries.length} {entries.length === 1 ? "item" : "items"}
        {category ? ` in ${getCategory(category)?.name}` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      {entries.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No matching items"
          description="Try a different search, another category or all price types."
          action={
            <Button asChild variant="outline">
              <Link href="/explore">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map((entry) => (
            <CatalogEntryCard key={entry.item.id} entry={entry} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
