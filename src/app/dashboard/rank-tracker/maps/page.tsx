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
import { GeoGridMap } from "@/components/features/geo-grid-map";
import Link from "next/link";
import type { LocalBusiness } from "@/types";

export default function MapsRankingsPage() {
  const { rankings, business } = useData();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<LocalBusiness[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/maps/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: query, location }) });
      const data = await res.json();
      if (res.ok) setResults(data.local_results ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {(rankings?.mapsRankingTypes ?? []).map((m) => (
            <Card key={m.type}>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">{m.type}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">#{m.rank || "—"}</p>
                {m.change !== 0 && <Badge variant={m.change > 0 ? "success" : "warning"} className="mt-2">{m.change > 0 ? "+" : ""}{m.change}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Geo-Grid Preview</CardTitle>
            <Link href="/dashboard/rank-tracker/geo-grid" className="text-sm text-indigo-600 hover:text-indigo-700">
              Full grid →
            </Link>
          </CardHeader>
          <CardContent>
            <GeoGridMap scan={rankings?.geoGrid} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Maps Rankings — Live Search</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Keyword</Label><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={business?.primaryCategory || ""} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={business?.city || ""} /></div>
              <div className="flex items-end"><Button type="submit" disabled={loading} className="w-full"><Search className="h-4 w-4" />Track Local Pack</Button></div>
            </form>
          </CardContent>
        </Card>
        {results.length > 0 && <div className="grid gap-3">{results.map((b, i) => <BusinessCard key={b.place_id ?? i} business={b} />)}</div>}
      </div>
    </PageDataGuard>
  );
}
