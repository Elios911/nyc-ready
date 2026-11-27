"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";

/**
 * Two-step inline delete ("Delete" → "Confirm"), so nothing is removed by a
 * single misclick and no browser confirm() dialog is needed.
 */
export function ConfirmDeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<ActionResult> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} onClick={() => setConfirming(true)}>
        <Trash2 />
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await onDelete();
            if (result.ok) toast.success(result.message ?? "Deleted");
            else toast.error(result.error);
            setConfirming(false);
          })
        }
      >
        {pending ? "Deleting…" : "Delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
    </span>
  );
}
