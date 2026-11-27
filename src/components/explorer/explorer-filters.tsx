import { Search } from "lucide-react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { priceTypeLabel } from "@/lib/catalog/freshness";
import { PRICE_TYPES, type CatalogSort } from "@/lib/catalog/types";

const SORT_LABELS: Record<CatalogSort, string> = {
  relevance: "Best match",
  name: "Name (A–Z)",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  unit_price: "Unit price (grouped by unit)",
  freshness: "Most recently observed",
};

/** Search + filters as a GET form, so results are linkable and work without JavaScript. */
export function ExplorerFilters({ q, category, type, sort }: { q: string; category: string; type: string; sort: CatalogSort }) {
  return (
    <Form action="/explore" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_13rem_auto]" role="search">
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search milk, gym, subway, haircut…" aria-label="Search prices" className="pl-9" />
      </div>
      <NativeSelect name="type" defaultValue={type} aria-label="Price type">
        <option value="">All price types</option>
        {PRICE_TYPES.map((value) => (
          <option key={value} value={value}>
            {priceTypeLabel(value)}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect name="sort" defaultValue={sort} aria-label="Sort by">
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit">Search</Button>
    </Form>
  );
}
