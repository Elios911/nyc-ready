import { MapPin, Plus } from "lucide-react";
import { Money } from "@/components/finance/money";
import { DAY_LABELS, DAYS_OF_WEEK, type ScheduleBlock } from "@/lib/domain/types";
import { blocksOverlap, formatTime, sortBlocks, type DaySummary } from "@/lib/finance/schedule";
import { cn } from "@/lib/utils";
import { ACTIVITY_ACCENT } from "./activity-style";
import { ScheduleBlockDialog } from "./schedule-block-dialog";

/** Monday–Sunday columns (stacked on small screens). Click a block to edit it. */
export function WeekGrid({ blocks, days }: { blocks: ScheduleBlock[]; days: DaySummary[] }) {
  const sorted = sortBlocks(blocks);
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {DAYS_OF_WEEK.map((day) => {
        const dayBlocks = sorted.filter((block) => block.dayOfWeek === day);
        const summary = days[day - 1];
        return (
          <section key={day} aria-labelledby={`day-${day}`} className="flex min-w-0 flex-col rounded-xl border bg-card" data-testid={`day-${day}`}>
            <header className="flex items-baseline justify-between gap-2 border-b px-3 py-2.5">
              <h2 id={`day-${day}`} className="text-sm font-semibold">
                <span className="xl:hidden">{DAY_LABELS[day].long}</span>
                <span className="hidden xl:inline">{DAY_LABELS[day].short}</span>
              </h2>
              <Money cents={summary?.totalCents ?? 0} compact className="text-xs text-muted-foreground" />
            </header>
            <ol className="flex flex-1 flex-col gap-1.5 p-2">
              {dayBlocks.map((block) => {
                const overlaps = dayBlocks.some((other) => other.id !== block.id && blocksOverlap(block, other));
                return (
                  <li key={block.id}>
                    <ScheduleBlockDialog
                      block={block}
                      trigger={
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-md border border-l-4 bg-background px-2 py-1.5 text-left transition-colors hover:bg-accent",
                            ACTIVITY_ACCENT[block.activityType],
                          )}
                          aria-label={`${block.title}, ${formatTime(block.startTime)} to ${formatTime(block.endTime)}. Edit`}
                        >
                          <span className="block text-[11px] text-muted-foreground tabular">
                            {formatTime(block.startTime)}–{formatTime(block.endTime)}
                            {overlaps ? <span className="ml-1 text-caution">· overlaps</span> : null}
                          </span>
                          <span className="block truncate text-sm font-medium">{block.title}</span>
                          <span className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                            {block.location ? (
                              <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
                                <MapPin className="size-3 shrink-0" aria-hidden />
                                {block.location}
                              </span>
                            ) : (
                              <span />
                            )}
                            {block.estimatedCostCents > 0 ? <Money cents={block.estimatedCostCents} compact className="font-medium text-foreground" /> : null}
                          </span>
                        </button>
                      }
                    />
                  </li>
                );
              })}
              <li className="mt-auto pt-1">
                <ScheduleBlockDialog
                  day={day}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      aria-label={`Add activity on ${DAY_LABELS[day].long}`}
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add
                    </button>
                  }
                />
              </li>
            </ol>
          </section>
        );
      })}
    </div>
  );
}
