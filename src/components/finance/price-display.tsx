import { ExternalLink, MapPin, Store } from "lucide-react";
import { describePrice, formatAge } from "@/lib/catalog/freshness";
import type { CostItem, DataSource, PriceObservation } from "@/lib/catalog/types";
import { describeQuantity, shouldShowUnitPrice, unitPriceCents } from "@/lib/catalog/unit-price";
import { formatCents } from "@/lib/finance/money";
import { FreshnessBadge } from "./freshness-badge";

const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;

/**
 * One price with everything needed to judge it: amount, package size, unit
 * price, merchant, location, source, date and freshness/confidence.
 */
export function PriceDisplay({
  item,
  price,
  now,
}: {
  item: CostItem;
  price: PriceObservation & { source: DataSource };
  now: Date;
}) {
  const description = describePrice(price, price.source, now);
  const unitPrice = unitPriceCents(price.priceCents, price.packageQuantity);
  const quantity = describeQuantity(price.packageQuantity, item.unit);
  const showUnit = unitPrice !== null && shouldShowUnitPrice(item.unit, price.packageQuantity);
  const date = price.verifiedAt ?? price.observedAt;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background/60 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold tabular">{formatCents(price.priceCents)}</span>
          {quantity && !(item.unit === "each" && price.packageQuantity === 1) ? (
            <span className="text-sm text-muted-foreground">for {quantity}</span>
          ) : null}
          {showUnit ? (
            <span className="text-sm text-muted-foreground tabular">
              · {formatCents(Math.round(unitPrice))} / {item.unit}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {price.merchantName ? (
            <span className="inline-flex items-center gap-1">
              <Store className="size-3" aria-hidden />
              {price.merchantName}
            </span>
          ) : null}
          {price.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {price.location}
            </span>
          ) : null}
          <span>
            Source:{" "}
            {price.source.sourceUrl ? (
              <a href={price.source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2">
                {price.source.name}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              price.source.name
            )}
          </span>
          {description.status !== "demo" ? (
            <span>
              {price.verifiedAt ? "Verified" : "Observed"} {formatAge(description.ageDays)} ({new Date(date).toLocaleDateString("en-US", { dateStyle: "medium" })})
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <FreshnessBadge description={description} />
        {description.status !== "demo" ? <span className="text-xs text-muted-foreground">{CONFIDENCE_LABEL[description.confidence]}</span> : null}
      </div>
    </div>
  );
}
