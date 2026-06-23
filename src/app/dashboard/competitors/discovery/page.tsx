"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { BusinessCard } from "@/components/business/business-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LocalBusiness } from "@/types";

export default function CompetitorDiscoveryPage() {
  const { rankings } = useData();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [liveResults, setLiveResults] = useState<LocalBusiness[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/maps/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: query, location }) });
      const data = await res.json();
      if (res.ok) setLiveResults(data.local_results ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Competitor Discovery</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Keyword</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. plumber, dentist, lawyer"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state or zip"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading || !query.trim()} className="w-full">
                  <Search className="h-4 w-4" />
                  {loading ? "Searching..." : "Search Maps"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {liveResults ? (
          <div className="grid gap-3">{liveResults.map((b, i) => <BusinessCard key={b.place_id ?? i} business={b} />)}</div>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="p-4">Competitor</th><th className="p-4">Distance</th><th className="p-4">Avg Rating</th><th className="p-4">Rank</th></tr></thead>
                <tbody>
                  {(rankings?.competitors ?? []).map((c) => (
                    <tr key={c.name} className={`border-b border-gray-100 ${c.isYou ? "bg-indigo-50" : ""}`}>
                      <td className="p-4 font-medium text-gray-900">{c.name}{c.isYou && <Badge className="ml-2" variant="secondary">You</Badge>}</td>
                      <td className="p-4 text-gray-600">{c.distance}</td>
                      <td className="p-4 text-gray-600">{c.rating} ({c.reviews})</td>
                      <td className="p-4 text-gray-600">#{c.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageDataGuard>
  );
}
