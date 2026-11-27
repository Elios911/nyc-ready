import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="NYC Ready home">
      <span aria-hidden className="grid size-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
        NR
      </span>
      <span>NYC Ready</span>
    </Link>
  );
}
