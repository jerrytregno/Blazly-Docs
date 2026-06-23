"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { GbpHealthScore } from "@/components/feature/gbp-health-score";
import { GbpAuditChecklist } from "@/components/features/gbp-audit-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function BusinessDetailsPage() {
  const { business, saveBusiness } = useData();
  const [form, setForm] = useState({ name: "", businessId: "", website: "", phone: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!business) return;
    setForm({
      name: business.name,
      businessId: business.businessId,
      website: business.website,
      phone: business.phone,
      status: business.status,
    });
  }, [business]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveBusiness(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Business Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "name", label: "Business Name" },
                { key: "businessId", label: "Business ID" },
                { key: "website", label: "Website" },
                { key: "phone", label: "Phone Number" },
                { key: "status", label: "Status" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                {saved && <span className="text-sm text-emerald-400">Saved</span>}
              </div>
            </form>
          </CardContent>
        </Card>
        <GbpHealthScore />
        <GbpAuditChecklist items={business?.gbpAuditChecklist} />
      </div>
    </PageDataGuard>
  );
}
