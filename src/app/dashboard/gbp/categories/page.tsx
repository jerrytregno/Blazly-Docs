"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const { business, saveBusiness } = useData();
  const [form, setForm] = useState({ primaryCategory: "", additional: "", competitor: "", missing: "", recommendations: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    setForm({
      primaryCategory: business.primaryCategory,
      additional: business.additionalCategories.join(", "),
      competitor: business.competitorCategories.join(", "),
      missing: business.missingCategories.join(", "),
      recommendations: business.categoryRecommendations.join("\n"),
    });
  }, [business]);

  const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const splitLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveBusiness({
      primaryCategory: form.primaryCategory,
      additionalCategories: split(form.additional),
      competitorCategories: split(form.competitor),
      missingCategories: split(form.missing),
      categoryRecommendations: splitLines(form.recommendations),
    });
    setSaving(false);
  };

  return (
    <PageDataGuard>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Category Management</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2"><Label>Primary Category</Label><Input value={form.primaryCategory} onChange={(e) => setForm({ ...form, primaryCategory: e.target.value })} /></div>
              <div className="space-y-2"><Label>Additional Categories (comma-separated)</Label><Input value={form.additional} onChange={(e) => setForm({ ...form, additional: e.target.value })} /></div>
              <div className="space-y-2"><Label>Competitor Categories</Label><Input value={form.competitor} onChange={(e) => setForm({ ...form, competitor: e.target.value })} /></div>
              <div className="space-y-2"><Label>Missing Categories</Label><Input value={form.missing} onChange={(e) => setForm({ ...form, missing: e.target.value })} /></div>
              <div className="space-y-2"><Label>Recommendations (one per line)</Label><textarea className="auth-input min-h-[80px] w-full rounded-xl px-4 py-2 text-sm" value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </form>
          </CardContent>
        </Card>
        <InsightPanel title="Category Recommendations" items={business?.categoryRecommendations.length ? business.categoryRecommendations : ["Add category recommendations after saving"]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
