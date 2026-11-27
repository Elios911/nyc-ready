import { FlaskConical } from "lucide-react";
import { StartButtons } from "@/components/marketing/start-buttons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Shown on the auth pages when Supabase isn't configured, instead of a form that can't work. */
export function DemoModeNotice() {
  return (
    <div className="space-y-6">
      <Alert variant="demo">
        <FlaskConical />
        <AlertTitle>Accounts aren&apos;t set up on this server</AlertTitle>
        <AlertDescription>
          <p>
            Supabase isn&apos;t configured, so sign-in is turned off. You can explore everything in demo mode. Data stays in this server&apos;s
            memory and all prices are demonstration data.
          </p>
          <p>To enable accounts, add your Supabase keys to <code>.env.local</code> (see the README).</p>
        </AlertDescription>
      </Alert>
      <StartButtons size="default" />
    </div>
  );
}
