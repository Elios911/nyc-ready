import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { DemoBanner } from "@/components/finance/demo-banner";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import type { AppSession } from "@/lib/auth/session";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

function AccountFooter({ session }: { session: AppSession }) {
  return (
    <div className="space-y-2 border-t pt-3">
      <p className="truncate px-2.5 text-xs text-muted-foreground" title={session.mode === "supabase" ? (session.email ?? undefined) : undefined}>
        {session.mode === "demo" ? "Demo session" : (session.email ?? "Signed in")}
      </p>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <LogOut />
          {session.mode === "demo" ? "End demo" : "Sign out"}
        </Button>
      </form>
    </div>
  );
}

/** Responsive application layout: fixed sidebar on desktop, slide-over menu on mobile. */
export function AppShell({ session, children }: { session: AppSession; children: ReactNode }) {
  const footer = <AccountFooter session={session} />;
  return (
    <div className="flex min-h-dvh flex-col">
      {session.mode === "demo" ? <DemoBanner /> : null}
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
          <Logo href="/dashboard" className="px-1.5" />
          <NavLinks />
          <div className="mt-auto">{footer}</div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b bg-card px-4 lg:hidden">
            <MobileNav header={<Logo href="/dashboard" />} footer={footer} />
            <Logo href="/dashboard" />
          </header>
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
