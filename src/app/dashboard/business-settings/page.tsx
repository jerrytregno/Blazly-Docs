"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { SectionHeader } from "@/components/layout/section-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetBusinessData } from "@/lib/firestore/reset-business";
import { markReplacingBusiness } from "@/lib/onboarding-flow";
import { getUserProfile, updateUserBusinessProfile } from "@/lib/user-profile";
import { parseGoogleMapsPlaceId, normalizeUserWebsite } from "@/lib/seo/maps-place";

type DialogAction = "replace" | "delete" | null;

interface EditForm {
  name: string;
  mapsLink: string;
  category: string;
  location: string;
  website: string;
  phone: string;
  address: string;
}

export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const { business, dashboard, loading, refresh, saveBusiness, analyzing } = useData();
  const router = useRouter();
  const [profile, setProfile] = useState<{
    website: string;
    category: string;
    location: string;
    mapsPlaceId: string;
  } | null>(null);
  const [form, setForm] = useState<EditForm>({
    name: "",
    mapsLink: "",
    category: "",
    location: "",
    website: "",
    phone: "",
    address: "",
  });
  const [dialog, setDialog] = useState<DialogAction>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((p) => {
      if (p) {
        setProfile({
          website: p.website,
          category: p.category,
          location: p.location,
          mapsPlaceId: p.mapsPlaceId ?? "",
        });
      }
    });
  }, [user]);

  useEffect(() => {
    if (!business && !profile) return;
    setForm({
      name: business?.name || "",
      mapsLink: business?.mapsPlaceId || profile?.mapsPlaceId || "",
      category: business?.primaryCategory || profile?.category || "",
      location: business?.city || profile?.location || "",
      website: normalizeUserWebsite(business?.userWebsite || business?.website || profile?.website),
      phone: business?.phone || "",
      address: business?.address || "",
    });
  }, [business, profile]);

  const handleReset = async () => {
    if (!user || !dialog) return;
    setProcessing(true);
    setError("");
    try {
      await resetBusinessData(user.uid);
      markReplacingBusiness();
      setDialog(null);
      router.replace("/onboarding");
    } catch {
      setError("Failed to reset business data. Please try again.");
      setProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");

    const trimmedMaps = form.mapsLink.trim();
    if (!trimmedMaps) {
      setError("Google Maps link is required.");
      return;
    }
    if (!form.name.trim()) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    try {
      const mapsPlaceId = parseGoogleMapsPlaceId(trimmedMaps) || trimmedMaps;
      const userWebsite = normalizeUserWebsite(form.website);

      await saveBusiness({
        name: form.name.trim(),
        mapsPlaceId,
        primaryCategory: form.category.trim(),
        city: form.location.trim(),
        userWebsite,
        website: userWebsite,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });

      await updateUserBusinessProfile(user.uid, {
        businessName: form.name.trim(),
        website: userWebsite,
        category: form.category.trim(),
        location: form.location.trim(),
        mapsPlaceId,
      });

      setSuccess("Business details saved. Refreshing SEO data…");
    } catch {
      setError("Failed to save business details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Business Name", value: business?.name || form.name || "—" },
    { label: "Website", value: business?.website || form.website || "—" },
    { label: "Category", value: business?.primaryCategory || form.category || "—" },
    { label: "Location", value: business?.city || form.location || "—" },
    { label: "Phone", value: business?.phone || form.phone || "—" },
    { label: "Address", value: business?.address || form.address || "—" },
  ];

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <SectionHeader
          title="Business Settings"
          description="Manage your active business profile. One business per account."
        />

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}

        <Card className="border-gray-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Active Business</CardTitle>
                <p className="text-sm text-gray-500">
                  {dashboard?.lastAnalyzedAt
                    ? "Data synced from Google Maps"
                    : "Run analysis to sync live data"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {f.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4 text-indigo-600" />
              Edit Details
            </CardTitle>
            <p className="text-sm text-gray-500">
              Update your business information. Saving will re-run SEO analysis with the new details.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-name">Business name</Label>
                  <Input
                    id="edit-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-maps">Google Maps link</Label>
                  <Input
                    id="edit-maps"
                    value={form.mapsLink}
                    onChange={(e) => setForm((f) => ({ ...f, mapsLink: e.target.value }))}
                    placeholder="Paste your Google Maps business URL or Place ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Business category</Label>
                  <Input
                    id="edit-category"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Primary location</Label>
                  <Input
                    id="edit-location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Chennai, Tamil Nadu, India"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">
                    Website URL{" "}
                    <span className="font-normal text-gray-400">(optional)</span>
                  </Label>
                  <Input
                    id="edit-website"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 ..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving || analyzing} className="gap-2">
                {saving || analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving…" : analyzing ? "Analyzing…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col border-amber-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                Replace Business
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-gray-600">
                Start fresh with a different business. Clears all SEO data and opens the setup form.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full border-amber-600 text-amber-800 hover:bg-amber-50"
                onClick={() => setDialog("replace")}
              >
                Use Different Business
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col border-red-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trash2 className="h-4 w-4 text-red-600" />
                Delete Business
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="flex-1 text-sm text-gray-600">
                Remove your business profile and all local SEO metrics from Blazly.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full border-red-600 text-red-700 hover:bg-red-50"
                onClick={() => setDialog("delete")}
              >
                Delete Business Information
              </Button>
            </CardContent>
          </Card>
        </div>

        <ConfirmDialog
          open={dialog === "replace"}
          title="Replace business?"
          description="This will delete your current business profile, rankings, reviews, and dashboard metrics. You will be taken to the business setup form to add a new business. Your account will not be deleted."
          confirmLabel="Replace business"
          loading={processing}
          onConfirm={handleReset}
          onCancel={() => !processing && setDialog(null)}
        />

        <ConfirmDialog
          open={dialog === "delete"}
          title="Delete business information?"
          description="All business data will be permanently removed from Firestore including GBP details, rankings, citations, and reviews. You can set up a new business afterward without creating a new account."
          confirmLabel="Delete and continue"
          loading={processing}
          onConfirm={handleReset}
          onCancel={() => !processing && setDialog(null)}
        />
      </div>
    </PageDataGuard>
  );
}
