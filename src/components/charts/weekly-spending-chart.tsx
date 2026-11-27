"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCentsCompact } from "@/lib/finance/money";
import { MoneyTooltip } from "./chart-tooltip";

export interface DayDatum {
  day: string;
  cents: number;
}

/** Planned spending per weekday from the weekly planner. Single series, single hue. */
export function WeeklySpendingChart({ data }: { data: DayDatum[] }) {
  return (
    <div className="h-48" role="img" aria-label={`Planned spending by day: ${data.map((d) => `${d.day} ${formatCentsCompact(d.cents)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) => formatCentsCompact(value)}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<MoneyTooltip />} />
          <Bar dataKey="cents" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
