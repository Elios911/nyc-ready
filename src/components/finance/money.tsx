import { formatCents, formatCentsCompact } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

/** Renders an amount of cents with tabular figures. */
export function Money({
  cents,
  compact = false,
  signed = false,
  className,
}: {
  cents: number | null | undefined;
  /** Hide ".00" on whole-dollar amounts. */
  compact?: boolean;
  /** Prefix positive values with "+". */
  signed?: boolean;
  className?: string;
}) {
  const text = compact ? formatCentsCompact(cents) : formatCents(cents);
  return (
    <span className={cn("tabular", className)}>
      {signed && typeof cents === "number" && cents > 0 ? "+" : ""}
      {text}
    </span>
  );
}
