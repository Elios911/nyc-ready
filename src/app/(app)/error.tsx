"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <AlertTriangle className="size-8 text-caution" aria-hidden />
      <h1 className="text-xl font-semibold">We couldn&apos;t load this page</h1>
      <p className="text-sm text-muted-foreground">
        Your data is safe. This is usually temporary, so try again in a moment.
        {error.digest ? <span className="mt-1 block text-xs">Reference: {error.digest}</span> : null}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
