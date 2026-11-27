import { formatCents } from "@/lib/finance/money";

/** Shared tooltip for single-series money charts. Text uses text tokens, never the series colour. */
export function MoneyTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: Array<{ value?: number | string }>; label?: string | number; suffix?: string }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground tabular">
        {formatCents(value)}
        {suffix ? ` ${suffix}` : ""}
      </p>
    </div>
  );
}
