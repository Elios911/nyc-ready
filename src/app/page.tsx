import { BadgeCheck, CalendarDays, Clock, FlaskConical, Info, Search, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { PlanPreview } from "@/components/marketing/plan-preview";
import { StartButtons } from "@/components/marketing/start-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

const MODULES = [
  {
    icon: UserRound,
    title: "Your starting point",
    body: "Take-home pay, savings, move date and how you want to live. A few essentials first; details whenever you like.",
  },
  {
    icon: CalendarDays,
    title: "A realistic week",
    body: "Lay out your Monday to Sunday: commute, gym, groceries, dinners out. See what a normal week actually costs.",
  },
  {
    icon: Search,
    title: "Everyday NYC prices",
    body: "Search groceries, transit, gyms and more, with unit pricing and a clear source and date on every price.",
  },
  {
    icon: Wallet,
    title: "A budget that adds up",
    body: "Income, fixed bills, flexible allowances, savings and move-in costs, all reconciled without double counting.",
  },
];

const LABELS = [
  { icon: BadgeCheck, label: "Recently verified", body: "Observed at a specific place, within the source's refresh window.", variant: "positive" as const },
  { icon: Clock, label: "Older observation", body: "Real, but old enough that it may have changed.", variant: "caution" as const },
  { icon: Info, label: "Estimate", body: "A provider's typical or starting price, not a specific observation.", variant: "secondary" as const },
  { icon: UserRound, label: "User-submitted", body: "Reported by people using NYC Ready. Not independently verified.", variant: "secondary" as const },
  { icon: FlaskConical, label: "Demo data", body: "Illustrative values for trying the app. Never presented as real.", variant: "demo" as const },
];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            {session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Open my plan</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="space-y-6">
            <p className="text-sm font-medium text-primary">For recent grads and first-job movers</p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              See what your life in New York would actually cost.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              NYC Ready turns &ldquo;can I even afford New York?&rdquo; into a plan. Build your week, price the things you buy, and see whether your
              take-home pay covers the life you want, with every number explained.
            </p>
            {session ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Continue planning</Link>
              </Button>
            ) : (
              <StartButtons />
            )}
            <p className="text-xs text-muted-foreground">No bank connections. No credit card. Your plan stays private to your account.</p>
          </div>
          <PlanPreview />
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Four pieces, one honest picture</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Rent matters, but so does everything else. NYC Ready connects your income, your routine and real-world prices.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {MODULES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="space-y-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">Every price tells you where it came from</h2>
            <p className="text-muted-foreground">
              A number without a source is a guess. Each price in the Cost Explorer shows its source, when it was observed, where it applies and how
              much to trust it. We never call a catalog &ldquo;real-time&rdquo; just because part of it updates.
            </p>
            <p className="text-sm text-muted-foreground">
              Prices come from official sources, licensed providers, public data and carefully maintained imports. We don&apos;t scrape retailer
              websites.
            </p>
          </div>
          <ul className="space-y-3">
            {LABELS.map(({ icon: Icon, label, body, variant }) => (
              <li key={label} className="flex items-start gap-3">
                <Badge variant={variant} className="mt-0.5 w-40 justify-start">
                  <Icon />
                  {label}
                </Badge>
                <span className="text-sm text-muted-foreground">{body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t bg-card">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Plan the move before you make it.</h2>
              <p className="mt-1 text-muted-foreground">It takes about two minutes to set up your starting point.</p>
            </div>
            {session ? (
              <Button asChild>
                <Link href="/dashboard">Open my plan</Link>
              </Button>
            ) : (
              <StartButtons size="default" />
            )}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} NYC Ready</p>
          <p>NYC Ready is a planning tool, not financial advice. Check important costs with the provider before you commit.</p>
        </div>
      </footer>
    </div>
  );
}
