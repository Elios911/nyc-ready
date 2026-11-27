"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCentsCompact } from "@/lib/finance/money";
import { MoneyTooltip } from "./chart-tooltip";

export interface BreakdownDatum {
  name: string;
  cents: number;
}

/**
 * Monthly expenses by category: one series, so one hue (primary) and no
 * legend; the card title names it. Horizontal bars keep long names readable.
 */
export function ExpenseBreakdownChart({ data }: { data: BreakdownDatum[] }) {
  const height = Math.max(120, data.length * 36 + 8);
  return (
    <div style={{ height }} role="img" aria-label={`Monthly expenses by category: ${data.map((d) => `${d.name} ${formatCentsCompact(d.cents)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<MoneyTooltip suffix="/ month" />} />
          <Bar dataKey="cents" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            <LabelList
              dataKey="cents"
              position="right"
              formatter={(value: unknown) => formatCentsCompact(Number(value))}
              style={{ fontSize: 12, fill: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
