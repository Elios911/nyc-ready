import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DemoControls } from "@/components/settings/demo-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/actions/auth";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const isDemo = session.mode === "demo";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your account and how NYC Ready stores your data." />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{isDemo ? "You're using a temporary demo session." : "Signed in with email and password."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
            <dt className="text-muted-foreground">Data mode</dt>
            <dd>{isDemo ? <Badge variant="demo">Demo mode</Badge> : <Badge variant="positive">Saved to your account</Badge>}</dd>
            {!isDemo ? (
              <>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{session.email ?? "—"}</dd>
              </>
            ) : null}
          </dl>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              {isDemo ? "End demo and clear its data" : "Sign out"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isDemo ? (
        <Card>
          <CardHeader>
            <CardTitle>About demo mode</CardTitle>
            <CardDescription>This server has no Supabase project configured.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-disc space-y-1 pl-5">
              <li>Your plan is kept in this server&apos;s memory for about a week, or until the server restarts. Nothing is saved permanently.</li>
              <li>Every price in the Cost Explorer is illustrative demonstration data from fictional merchants, not a real or current price.</li>
              <li>The example plan uses made-up round numbers to show how the pieces fit together.</li>
            </ul>
            <DemoControls />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Coming later</CardTitle>
          <CardDescription>These aren&apos;t available yet, so there are no controls for them here.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Comparing several scenarios side by side (e.g. roommates vs. living alone)</li>
            <li>Exporting your plan and deleting your account from this page</li>
            <li>Submitting prices you&apos;ve seen in NYC</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
