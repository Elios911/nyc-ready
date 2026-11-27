import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A single headline number with a label and a short explanation of how it is derived. */
export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "positive" | "caution" | "negative";
  icon?: ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-1.5 px-4">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div
          className={cn(
            "text-2xl font-semibold tracking-tight",
            tone === "positive" && "text-positive",
            tone === "caution" && "text-caution",
            tone === "negative" && "text-negative",
          )}
        >
          {value}
        </div>
        {detail ? <p className="text-xs leading-snug text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
