import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getCatalogProvider } from "@/lib/catalog";
import { DEFAULT_FRESH_DAYS } from "@/lib/catalog/freshness";
import type { SourceType } from "@/lib/catalog/types";

export const metadata: Metadata = { title: "Data sources" };

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official: "Official source",
  licensed_provider: "Licensed provider",
  public_dataset: "Public dataset",
  curated_manual: "Curated by NYC Ready",
  user_submission: "User submissions",
  demo: "Demonstration data",
};

export default async function SourcesPage() {
  await requireSession();
  const sources = await (await getCatalogProvider()).listSources();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/explore">
          <ArrowLeft />
          Back to Cost Explorer
        </Link>
      </Button>
      <PageHeader
        title="Where our prices come from"
        description="Every price in NYC Ready is linked to one of these sources. Old prices are kept as history rather than overwritten."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <CardTitle className="text-base">{source.name}</CardTitle>
              <CardDescription>{source.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={source.sourceType === "demo" ? "demo" : "secondary"}>{SOURCE_TYPE_LABELS[source.sourceType]}</Badge>
              <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Coverage</dt>
                <dd>{source.geographicScope ?? "Not specified"}</dd>
                <dt className="text-muted-foreground">Refreshed</dt>
                <dd>{source.refreshIntervalDays ? `About every ${source.refreshIntervalDays} days` : "No schedule"}</dd>
                <dt className="text-muted-foreground">Limitations</dt>
                <dd>{source.limitations ?? "None recorded"}</dd>
              </dl>
              {source.sourceUrl ? (
                <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                  Visit source <ExternalLink className="size-3" />
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How we label freshness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            An observed price counts as <strong className="text-foreground">recently verified</strong> while it is within its source&apos;s refresh
            window ({DEFAULT_FRESH_DAYS} days if the source doesn&apos;t set one). After that it&apos;s shown as an{" "}
            <strong className="text-foreground">older observation</strong>. Provider estimates, user submissions and demo data are always labelled as
            such, whatever their date.
          </p>
          <p>
            We use official sources, licensed providers, permitted public data and curated imports. We don&apos;t scrape retailer websites, and we
            never describe a whole catalog as real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
