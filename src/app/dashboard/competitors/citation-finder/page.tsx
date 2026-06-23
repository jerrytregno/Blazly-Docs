"use client";

import { useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { CitationTrackerTable } from "@/components/features/citation-tracker-table";
import { FeaturePanel } from "@/components/features/feature-panel";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CitationListing } from "@/types/firestore";

type Filter = "all" | CitationListing["status"];

export default function CitationFinderPage() {
  const { rankings } = useData();
  const listings = rankings?.citationHealth.listings ?? [];
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? listings : listings.filter((c) => c.status === filter);

  const counts = {
    live: listings.filter((c) => c.status === "live").length,
    missing: listings.filter((c) => c.status === "missing").length,
    dead: listings.filter((c) => c.status === "dead").length,
    submitable: listings.filter((c) => c.submitable && c.status === "missing").length,
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <FeaturePanel
          title="Citation Finder & Tracker"
          badge="WhiteSpark-style discovery"
          description="Discover where competitors are listed, track your citations, and filter by submitability to build new listings fast."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Live", value: counts.live, filter: "live" as Filter },
              { label: "Missing", value: counts.missing, filter: "missing" as Filter },
              { label: "Dead", value: counts.dead, filter: "dead" as Filter },
              { label: "Easy Submit", value: counts.submitable, filter: "missing" as Filter },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setFilter(s.filter)}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "live", "missing", "dead"] as Filter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </FeaturePanel>

        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>Citation Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <CitationTrackerTable listings={filtered} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightPanel
            title="Competitor Citation Gaps"
            items={
              rankings?.citationHealth.competitorCitations.length
                ? rankings.citationHealth.competitorCitations
                : ["No gaps detected yet — refresh analysis"]
            }
            variant="ai"
          />
          <InsightPanel
            title="Missing High-Value Directories"
            items={
              rankings?.citationHealth.missingDirectories.length
                ? rankings.citationHealth.missingDirectories
                : ["All key directories covered"]
            }
          />
        </div>
      </div>
    </PageDataGuard>
  );
}
