"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LocationPage() {
  const { business, saveBusiness } = useData();
  const [form, setForm] = useState({ country: "", state: "", city: "", address: "", zip: "", serviceAreas: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    setForm({
      country: business.country,
      state: business.state,
      city: business.city,
      address: business.address,
      zip: business.zip,
      serviceAreas: business.serviceAreas.join(", "),
    });
  }, [business]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveBusiness({
      ...form,
      serviceAreas: form.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <PageDataGuard>
      <Card>
        <CardHeader><CardTitle>Location Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["country", "state", "city", "address", "zip"] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key === "zip" ? "ZIP Code" : key}</Label>
                  <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Service Areas (comma-separated)</Label>
              <Input value={form.serviceAreas} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>
    </PageDataGuard>
  );
}
