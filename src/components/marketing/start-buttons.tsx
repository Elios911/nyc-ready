import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { startDemo } from "@/lib/actions/auth";
import { isDemoMode } from "@/lib/env";

/** Primary call to action: start the demo (no Supabase) or create an account. */
export function StartButtons({ size = "lg" }: { size?: "default" | "lg" }) {
  if (isDemoMode()) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <form action={startDemo.bind(null, "example")}>
          <Button size={size} type="submit">
            Explore the example plan <ArrowRight />
          </Button>
        </form>
        <form action={startDemo.bind(null, "blank")}>
          <Button size={size} variant="outline" type="submit">
            Start from scratch
          </Button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size={size} asChild>
        <Link href="/signup">
          Start planning for free <ArrowRight />
        </Link>
      </Button>
      <Button size={size} variant="outline" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  );
}
