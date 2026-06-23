"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const { business, saveBusiness } = useData();
  const [form, setForm] = useState({ description: "", shortDescription: "", businessSummary: "", readabilityScore: 0, missingKeywords: "", missingServices: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    setForm({
      description: business.description,
      shortDescription: business.shortDescription,
      businessSummary: business.businessSummary,
      readabilityScore: business.readabilityScore,
      missingKeywords: business.missingKeywords.join(", "),
      missingServices: business.missingServicesInDescription.join(", "),
    });
  }, [business]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveBusiness({
      description: form.description,
      shortDescription: form.shortDescription,
      businessSummary: form.businessSummary,
      readabilityScore: Number(form.readabilityScore),
      missingKeywords: form.missingKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      missingServicesInDescription: form.missingServices.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <PageDataGuard>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>About Business</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2"><Label>Description</Label><textarea className="auth-input min-h-[80px] w-full rounded-xl px-4 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Short Description</Label><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
              <div className="space-y-2"><Label>Business Summary</Label><textarea className="auth-input min-h-[60px] w-full rounded-xl px-4 py-2 text-sm" value={form.businessSummary} onChange={(e) => setForm({ ...form, businessSummary: e.target.value })} /></div>
              <div className="space-y-2"><Label>Readability Score</Label><Input type="number" min={0} max={100} value={form.readabilityScore} onChange={(e) => setForm({ ...form, readabilityScore: Number(e.target.value) })} /></div>
              <ProgressBar value={form.readabilityScore} />
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </form>
          </CardContent>
        </Card>
        <InsightPanel title="Optimization" items={[
          form.missingKeywords ? `Missing keywords: ${form.missingKeywords}` : "No missing keywords tracked",
          form.missingServices ? `Missing services: ${form.missingServices}` : "No missing services tracked",
        ]} variant="ai" />
      </div>
    </PageDataGuard>
  );
}
