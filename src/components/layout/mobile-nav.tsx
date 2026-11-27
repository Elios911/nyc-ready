"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";

export function MobileNav({ header, footer }: { header: ReactNode; footer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-4">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Move between sections of NYC Ready</SheetDescription>
        <div className="pb-2">{header}</div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <div className="mt-auto">{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
