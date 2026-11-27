import { CircleAlert, CircleCheck, CircleHelp, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCents } from "@/lib/finance/money";
import { THIN_MARGIN_RATIO, type PlanSummary } from "@/lib/finance/plan";

/**
 * States what the numbers show, using explicit rules rather than judgments
 * about the user's life. The rule is always printed alongside the result.
 */
export function PlanStatus({ summary }: { summary: PlanSummary }) {
  const { status, savings, income } = summary;
  const threshold = `${Math.round(THIN_MARGIN_RATIO * 100)}%`;

  if (status === "missing_income") {
    return (
      <Alert>
        <CircleHelp />
        <AlertTitle>Add your take-home pay to see if this plan works</AlertTitle>
        <AlertDescription>
          <p>
            Every calculation starts from monthly take-home pay.{" "}
            <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
              Add it in My Profile
            </Link>
            .
          </p>
        </AlertDescription>
      </Alert>
    );
  }
  if (status === "shortfall") {
    return (
      <Alert variant="negative">
        <CircleAlert />
        <AlertTitle>Planned spending and savings exceed income by {formatCents(-savings.unallocatedMonthlyCents)} a month</AlertTitle>
        <AlertDescription>
          <p>Try lowering an allowance, a fixed cost or a savings target, or adjust activities in your weekly planner.</p>
        </AlertDescription>
      </Alert>
    );
  }
  if (status === "thin_margin") {
    return (
      <Alert variant="caution">
        <TriangleAlert />
        <AlertTitle>The plan fits, with {formatCents(savings.unallocatedMonthlyCents)} a month unallocated</AlertTitle>
        <AlertDescription>
          <p>
            That&apos;s under {threshold} of income ({formatCents(Math.round(income.totalMonthlyCents * THIN_MARGIN_RATIO))}), so an unexpected
            cost could push you over. Consider a buffer or an emergency fund contribution.
          </p>
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="positive">
      <CircleCheck />
      <AlertTitle>Your planned expenses and savings fit within your take-home pay</AlertTitle>
      <AlertDescription>
        <p>
          {formatCents(savings.unallocatedMonthlyCents)} a month is unallocated, which is at least {threshold} of income. This only reflects what
          you&apos;ve entered, so add anything that&apos;s missing.
        </p>
      </AlertDescription>
    </Alert>
  );
}
