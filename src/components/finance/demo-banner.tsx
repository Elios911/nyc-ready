import { FlaskConical } from "lucide-react";
import Link from "next/link";

/** Shown on every app page in demo mode so demo data can't be mistaken for real figures. */
export function DemoBanner() {
  return (
    <div role="status" className="border-b border-demo/20 bg-demo-soft px-4 py-2 text-center text-xs text-foreground sm:text-sm">
      <FlaskConical aria-hidden className="mr-1.5 inline size-3.5 -translate-y-px text-demo" />
      <strong className="font-medium">Demo mode.</strong> Prices and the example plan are illustrative demonstration data, not real NYC prices. Your
      changes are kept temporarily on this server.{" "}
      <Link href="/settings" className="underline underline-offset-2">
        Learn more
      </Link>
    </div>
  );
}
