import Link from "next/link";
import { CategoryIcon } from "@/components/finance/category-icon";
import { getCategory, SPENDING_GROUP_IDS } from "@/lib/domain/categories";
import { cn } from "@/lib/utils";

function hrefFor(params: { q: string; type: string; sort: string }, category?: string) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (category) search.set("category", category);
  if (params.type) search.set("type", params.type);
  if (params.sort && params.sort !== "relevance") search.set("sort", params.sort);
  const query = search.toString();
  return query ? `/explore?${query}` : "/explore";
}

export function CategoryTabs({ active, q, type, sort }: { active: string; q: string; type: string; sort: string }) {
  const params = { q, type, sort };
  const pill = (selected: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
      selected ? "border-primary/30 bg-accent font-medium text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground",
    );
  return (
    <nav aria-label="Categories" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Link href={hrefFor(params)} className={pill(!active)} aria-current={!active ? "page" : undefined}>
        All
      </Link>
      {SPENDING_GROUP_IDS.map((id) => (
        <Link key={id} href={hrefFor(params, id)} className={pill(active === id || active.startsWith(`${id}.`))} aria-current={active === id ? "page" : undefined}>
          <CategoryIcon categoryId={id} className="size-3.5" />
          {getCategory(id)?.name}
        </Link>
      ))}
    </nav>
  );
}
