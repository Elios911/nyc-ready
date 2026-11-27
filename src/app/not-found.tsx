import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="text-muted-foreground">The link may be broken, or the page may have moved.</p>
        <Button asChild>
          <Link href="/">Back to NYC Ready</Link>
        </Button>
      </div>
    </main>
  );
}
