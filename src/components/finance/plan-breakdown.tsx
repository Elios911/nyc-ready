import type { ReactNode } from "react";
import { formatPercent } from "@/lib/finance/money";
import type { PlanSummary } from "@/lib/finance/plan";
import { cn } from "@/lib/utils";
import { Money } from "./money";

function Line({ label, cents, sign, strong, hint }: { label: ReactNode; cents: number; sign?: "+" | "−" | "="; strong?: boolean; hint?: ReactNode }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-1.5 text-sm", strong && "border-t pt-2.5 font-semibold")}>
      <div className="min-w-0">
        <span className={cn(!strong && "text-muted-foreground")}>
          {sign ? <span className="mr-1.5 inline-block w-3 text-center font-mono text-xs">{sign}</span> : null}
          {label}
        </span>
        {hint ? <p className="ml-[1.125rem] text-xs font-normal text-muted-foreground">{hint}</p> : null}
      </div>
      <Money cents={cents} className={cn(strong && cents < 0 && "text-negative")} />
    </div>
  );
}

/**
 * The full monthly calculation, line by line, so users can see exactly how
 * each total is derived (see src/lib/finance/plan.ts for the rules).
 */
export function PlanBreakdown({ summary }: { summary: PlanSummary }) {
  const { income, expenses, savings, relocation } = summary;
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Monthly</h3>
        <Line label="Take-home pay" cents={income.takeHomeMonthlyCents} hint={income.hasTakeHome ? undefined : "Not set yet. Add it in My Profile."} />
        {income.additionalMonthlyCents > 0 ? <Line sign="+" label="Additional income" cents={income.additionalMonthlyCents} /> : null}
        <Line sign="−" label="Fixed expenses" cents={expenses.fixedMonthlyCents} />
        <Line sign="−" label="Variable allowances" cents={expenses.variableAllowanceMonthlyCents} />
        {expenses.uncoveredPlannedMonthlyCents > 0 ? (
          <Line
            sign="−"
            label="Planner spending not covered by allowances"
            cents={expenses.uncoveredPlannedMonthlyCents}
            hint="Weekly planner costs above your allowance for that category (× 52 ÷ 12)."
          />
        ) : null}
        <Line sign="−" label="Planned savings" cents={savings.plannedMonthlyCents} />
        <Line sign="=" label="Unallocated each month" cents={savings.unallocatedMonthlyCents} strong />
        <p className="mt-2 text-xs text-muted-foreground">
          Expenses are {formatPercent(summary.percentOfIncomeSpent)} of income. Total saved per month (planned savings plus anything unallocated):{" "}
          <Money cents={savings.totalMonthlyCents} className="font-medium text-foreground" />.
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Before you move</h3>
        <Line label="Current savings" cents={relocation.currentSavingsCents ?? 0} hint={relocation.currentSavingsCents === null ? "Not set yet." : undefined} />
        <Line sign="−" label="One-time relocation costs" cents={relocation.oneTimeCostsCents} />
        <Line sign="=" label="Left after moving in" cents={relocation.positionBeforeMoveCents ?? -relocation.oneTimeCostsCents} strong />
      </div>
    </div>
  );
}
