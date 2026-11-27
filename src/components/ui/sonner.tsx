"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{ classNames: { toast: "!rounded-lg !border !border-border !bg-card !text-card-foreground !shadow-md" } }}
      {...props}
    />
  );
}

export { Toaster };
