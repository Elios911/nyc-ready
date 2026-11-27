import { ArrowRight, CalendarDays, PiggyBank, Search, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { WeeklySpendingChart } from "@/components/charts/weekly-spending-chart";
import { MetricCard } from "@/components/finance/metric-card";
import { Money } from "@/components/finance/money";
import { PlanBreakdown } from "@/components/finance/plan-breakdown";
import { PlanStatus } from "@/components/finance/plan-status";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPlan } from "@/lib/data/plan";
import { getCategory } from "@/lib/domain/categories";
import { DAY_LABELS } from "@/lib/domain/types";
import { formatPercent } from "@/lib/finance/money";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const { profile, scenario, summary } = await loadPlan();
  if (!profile.onboardingCompletedAt) redirect("/onboarding");

  const { income, expenses, savings, schedule } = summary;
  const breakdown = summary.categories
    .filter((c) => c.countedMonthlyCents > 0)
    .map((c) => ({ name: getCategory(c.categoryId)?.name ?? "Other", cents: c.countedMonthlyCents }));
  const days = schedule.days.map((d) => ({ day: DAY_LABELS[d.dayOfWeek].short, cents: d.totalCents }));
  const firstName = profile.fullName?.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Hi ${firstName}, here's your NYC plan` : "Your NYC plan"}
        description={
          <>
            {scenario.name}
            {profile.expectedMoveDate
              ? ` · moving ${new Date(`${profile.expectedMoveDate}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
              : ""}
            {profile.preferredNeighborhoods.length ? ` · looking at ${profile.preferredNeighborhoods.join(", ")}` : ""}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Monthly take-home"
          icon={<Wallet className="size-4" aria-hidden />}
          value={<Money cents={income.totalMonthlyCents} compact />}
          detail={income.additionalMonthlyCents > 0 ? "Take-home pay plus additional income" : "After taxes, from your profile"}
        />
        <MetricCard
          label="Estimated monthly expenses"
          value={<Money cents={expenses.totalMonthlyCents} compact />}
          detail={`${formatPercent(summary.percentOfIncomeSpent)} of income · fixed + allowances + uncovered planner spending`}
        />
        <MetricCard
          label="Remaining each month"
          value={<Money cents={savings.unallocatedMonthlyCents} compact />}
          tone={savings.unallocatedMonthlyCents < 0 ? "negative" : summary.status === "thin_margin" ? "caution" : "positive"}
          detail="Income − expenses − planned savings"
        />
        <MetricCard
          label="Savings target"
          icon={<PiggyBank className="size-4" aria-hidden />}
          value={<Money cents={savings.plannedMonthlyCents} compact />}
          detail={
            <>
              Planned per month. With anything unallocated: <Money cents={savings.totalMonthlyCents} compact />
            </>
          }
        />
      </div>

      <PlanStatus summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Where your money goes each month</CardTitle>
            <CardDescription>Fixed costs, allowances and uncovered planner spending, by category.</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/budget">
                  Budget <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {breakdown.length ? (
              <ExpenseBreakdownChart data={breakdown} />
            ) : (
              <EmptyState
                title="No expenses yet"
                description="Add rent and a few allowances to see your breakdown."
                action={
                  <Button asChild>
                    <Link href="/budget">Open My Budget</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How this is calculated</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanBreakdown summary={summary} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your typical week</CardTitle>
            <CardDescription>
              <Money cents={schedule.weeklyTotalCents} compact /> planned per week (≈ <Money cents={schedule.monthlyEquivalentCents} compact /> a
              month) across {summary.schedule.days.reduce((n, d) => n + d.blockCount, 0)} activities.
            </CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/planner">
                  Planner <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <WeeklySpendingChart data={days} />
          </CardContent>
        </Card>
        <div className="grid gap-3">
          <QuickLink href="/planner" icon={<CalendarDays />} title="Plan your week" body="Add your commute, workouts and nights out." />
          <QuickLink href="/explore" icon={<Search />} title="Explore NYC costs" body="Search prices and add them to your budget." />
          <QuickLink href="/budget" icon={<Wallet />} title="Adjust your budget" body="Bills, allowances, savings and move-in costs." />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-medium">
          {title}
          <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}
