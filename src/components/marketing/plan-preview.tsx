import { Badge } from "@/components/ui/badge";

/** Static, clearly labelled illustration of the dashboard for the landing page. */
const ROWS = [
  { label: "Rent (with roommates)", value: "$1,400", width: "62%" },
  { label: "Groceries", value: "$390", width: "18%" },
  { label: "Transit", value: "$135", width: "8%" },
  { label: "Eating out & social", value: "$250", width: "12%" },
];

export function PlanPreview() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Monthly plan</p>
        <Badge variant="demo">Illustrative example</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-b pb-5">
        <div>
          <p className="text-xs text-muted-foreground">Take-home</p>
          <p className="text-xl font-semibold tabular">$4,200</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-xl font-semibold tabular">$3,060</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Left over</p>
          <p className="text-xl font-semibold text-positive tabular">$1,140</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-medium text-muted-foreground">Largest categories</p>
      <ul className="mt-3 space-y-3">
        {ROWS.map((row) => (
          <li key={row.label} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular">{row.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: row.width }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted-foreground">Figures are made up to show how the planner works, not real NYC prices.</p>
    </div>
  );
}
