import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import { WeeklySpendingChart } from "@/components/charts/weekly-spending-chart";
import { Money } from "@/components/finance/money";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ScheduleBlockDialog } from "@/components/planner/schedule-block-dialog";
import { WeekGrid } from "@/components/planner/week-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPlan } from "@/lib/data/plan";
import { DAY_LABELS } from "@/lib/domain/types";
import { monthlyToWeeklyCents } from "@/lib/finance/frequency";

export const metadata: Metadata = { title: "Weekly Planner" };

export default async function PlannerPage() {
  const { scheduleBlocks, summary } = await loadPlan();
  const { schedule } = summary;
  const weeklyAllowance = monthlyToWeeklyCents(summary.expenses.variableAllowanceMonthlyCents);
  const chartData = schedule.days.map((day) => ({ day: DAY_LABELS[day.dayOfWeek].short, cents: day.totalCents }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Planner"
        description="Map out a typical week in NYC. Add what each activity usually costs and it flows into your budget."
        actions={
          <ScheduleBlockDialog
            trigger={
              <Button>
                <CalendarPlus />
                Add activity
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Planned spending this week</p>
            <Money cents={schedule.weeklyTotalCents} className="text-2xl font-semibold" />
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Monthly equivalent</p>
            <Money cents={schedule.monthlyEquivalentCents} className="text-2xl font-semibold" />
            <p className="text-xs text-muted-foreground">Weekly total × 52 ÷ 12</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Weekly allowance from your budget</p>
            <Money cents={weeklyAllowance} className="text-2xl font-semibold" />
            <p className="text-xs text-muted-foreground">Variable allowances × 12 ÷ 52</p>
          </CardContent>
        </Card>
      </div>

      {scheduleBlocks.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus />}
          title="Your week is empty"
          description="Start with the basics: your commute and work hours. Then add the gym, grocery runs and nights out."
          action={
            <ScheduleBlockDialog
              day={1}
              trigger={
                <Button>
                  <CalendarPlus />
                  Add your first activity
                </Button>
              }
            />
          }
        />
      ) : null}

      <WeekGrid blocks={scheduleBlocks} days={schedule.days} />

      <Card>
        <CardHeader>
          <CardTitle>Spending by day</CardTitle>
          <CardDescription>
            Planner spending is matched to your variable allowances by category. Only spending above an allowance is added to your monthly
            expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklySpendingChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
