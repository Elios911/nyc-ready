import { BadgeCheck, CircleAlert, Clock, FlaskConical, Info, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PriceDescription } from "@/lib/catalog/freshness";

const STYLE: Record<PriceDescription["status"], { variant: "demo" | "positive" | "caution" | "secondary" | "negative"; Icon: typeof Info }> = {
  demo: { variant: "demo", Icon: FlaskConical },
  recent: { variant: "positive", Icon: BadgeCheck },
  stale: { variant: "caution", Icon: Clock },
  estimate: { variant: "secondary", Icon: Info },
  user_submitted: { variant: "secondary", Icon: UserRound },
  expired: { variant: "negative", Icon: CircleAlert },
};

/** Badge describing where a price stands: demo, recently verified, older, estimate… */
export function FreshnessBadge({ description }: { description: PriceDescription }) {
  const { variant, Icon } = STYLE[description.status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} tabIndex={0} className="cursor-help">
          <Icon />
          {description.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{description.explanation}</TooltipContent>
    </Tooltip>
  );
}
