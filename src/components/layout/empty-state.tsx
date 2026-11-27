import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center", className)}>
      {icon ? <div className="mb-1 text-muted-foreground [&_svg]:size-6">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
