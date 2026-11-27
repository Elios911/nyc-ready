import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AllowanceTable } from "@/components/budget/allowance-table";
import { BudgetItemDialog } from "@/components/budget/budget-item-dialog";
import { BudgetSection } from "@/components/budget/budget-section";
import { Money } from "@/components/finance/money";
import { PlanBreakdown } from "@/components/finance/plan-breakdown";
import { PlanStatus } from "@/components/finance/plan-status";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPlan } from "@/lib/data/plan";
import type { BudgetItemType } from "@/lib/domain/types";

export const metadata: Metadata = { title: "My Budget" };

export default async function BudgetPage() {
  const { profile, budgetItems, summary } = await loadPlan();
  const byType = (type: BudgetItemType) => budgetItems.filter((item) => item.itemType === type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Budget"
        description="Your monthly income, bills, allowances, savings and one-time move-in costs. Weekly and yearly amounts are converted to monthly."
        actions={
          <BudgetItemDialog
            trigger={
              <Button>
                <Plus />
                Add item
              </Button>
            }
          />
        }
      />

      <PlanStatus summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <BudgetSection
            title="Income"
            description="Take-home pay comes from your profile. Add side income here."
            itemType="income"
            items={byType("income")}
            totalCents={summary.income.totalMonthlyCents}
            totalLabel="Total monthly income"
            addLabel="Add income"
            emptyText=""
            leadingRow={
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">Take-home pay</p>
                  <p className="text-xs text-muted-foreground">
                    From{" "}
                    <Link href="/profile" className="underline underline-offset-2">
                      My Profile
                    </Link>
                  </p>
                </div>
                {profile.monthlyTakeHomeIncomeCents === null ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/profile">Add take-home pay</Link>
                  </Button>
                ) : (
                  <Money cents={profile.monthlyTakeHomeIncomeCents} className="font-medium" />
                )}
              </div>
            }
          />
          <BudgetSection
            title="Fixed expenses"
            description="Recurring bills with a set amount: rent, phone, internet, memberships, insurance."
            itemType="fixed"
            items={byType("fixed")}
            totalCents={summary.expenses.fixedMonthlyCents}
            totalLabel="Fixed per month"
            addLabel="Add expense"
            emptyText="No fixed expenses yet. Rent is usually the first one to add."
          />
          <BudgetSection
            title="Variable allowances"
            description="How much you plan to spend on things that vary: groceries, eating out, clothing, fun."
            itemType="variable"
            items={byType("variable")}
            totalCents={summary.expenses.variableAllowanceMonthlyCents}
            totalLabel="Allowances per month"
            addLabel="Add allowance"
            emptyText="No allowances yet. Try groceries and eating out."
          />
          <BudgetSection
            title="Savings"
            description="Money you set aside on purpose. Savings are never counted as expenses."
            itemType="savings"
            items={byType("savings")}
            totalCents={summary.savings.plannedMonthlyCents}
            totalLabel="Planned savings per month"
            addLabel="Add savings goal"
            emptyText="No savings contributions yet. An emergency fund is a good start."
          />
          <BudgetSection
            title="One-time relocation costs"
            description="Deposit, first month's rent, movers, furniture. These are kept out of monthly totals."
            itemType="relocation"
            items={byType("relocation")}
            totalCents={summary.relocation.oneTimeCostsCents}
            totalLabel="Total move-in costs"
            addLabel="Add cost"
            emptyText="No move-in costs yet."
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>How your totals are calculated</CardTitle>
              <CardDescription>Every number comes from what you&apos;ve entered.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanBreakdown summary={summary} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Allowances vs. weekly planner</CardTitle>
              <CardDescription>Planner spending is drawn from the matching allowance first, so nothing is counted twice.</CardDescription>
            </CardHeader>
            <CardContent>
              <AllowanceTable categories={summary.categories} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
