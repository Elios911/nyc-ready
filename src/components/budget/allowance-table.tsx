import { Money } from "@/components/finance/money";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCategory } from "@/lib/domain/categories";
import type { CategoryReconciliation } from "@/lib/finance/plan";

/**
 * Allowance vs planned spending per category: shows how the weekly planner
 * is reconciled with variable allowances so nothing is counted twice.
 */
export function AllowanceTable({ categories }: { categories: CategoryReconciliation[] }) {
  const rows = categories.filter((c) => c.allowanceMonthlyCents > 0 || c.plannedMonthlyCents > 0);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Add variable allowances or activities with costs to compare them here.</p>;
  }
  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-2">Category</TableHead>
          <TableHead className="px-2 text-right">Allowance</TableHead>
          <TableHead className="px-2 text-right">Planner</TableHead>
          <TableHead className="px-2 text-right">Extra</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.categoryId}>
            <TableCell className="px-2 text-xs">
              {getCategory(row.categoryId)?.name ?? "Other"}
            </TableCell>
            <TableCell className="px-2 text-right text-xs">
              <Money cents={row.allowanceMonthlyCents} compact />
            </TableCell>
            <TableCell className="px-2 text-right text-xs">
              <Money cents={row.plannedMonthlyCents} compact />
            </TableCell>
            <TableCell className="px-2 text-right text-xs">
              {row.uncoveredPlannedMonthlyCents > 0 ? (
                <Badge variant="caution">
                  +<Money cents={row.uncoveredPlannedMonthlyCents} compact />
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{row.plannedMonthlyCents > 0 ? "Covered" : "—"}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <p className="mt-2 text-xs text-muted-foreground">Monthly amounts. Planner = weekly planner spending × 52 ÷ 12.</p>
    </>
  );
}
