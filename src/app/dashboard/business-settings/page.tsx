"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { usePlan } from "@/components/providers/plan-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddBusiness } from "@/hooks/use-add-business";
import { getUserProfile, updateUserBusinessProfile } from "@/lib/user-profile";
import { parseGoogleMapsPlaceId, normalizeUserWebsite } from "@/lib/seo/maps-place";

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
  const { business, dashboard, saveBusiness, analyzing } = useData();
  const { businessSlots, businessesUsed, isPro, loading: planLoading } = usePlan();
  const { requestAdd, dialog: addBusinessDialog } = useAddBusiness();
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

  const hasActiveBusiness = Boolean(business?.name?.trim());
  const unusedSlots = Math.max(0, businessSlots - businessesUsed);
  const canAddBusiness = isPro && hasActiveBusiness && unusedSlots > 0;
  const showAddBusinessCta =
    !planLoading && (canAddBusiness || (isPro && hasActiveBusiness && unusedSlots === 0));

  const addBusinessButton = showAddBusinessCta ? (
    canAddBusiness ? (
      <Button
        type="button"
        onClick={requestAdd}
        className="shrink-0 gap-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Add Business
      </Button>
    ) : (
      <Link href="/dashboard/pricing">
        <Button type="button" className="shrink-0 gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Add Business
        </Button>
      </Link>
    )
  ) : null;

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        {addBusinessDialog}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Business Settings</h1>
            <p className="mt-2 text-base text-gray-500">
              Manage your active business profile and add more locations when you&apos;ve paid for
              them.
            </p>
          </div>
          {addBusinessButton}
        </div>

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
          <CardHeader>
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

        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              Need to replace this business or remove a profile? Contact{" "}
              <a
                href="mailto:jerry@blazly.ai"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                jerry@blazly.ai
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </PageDataGuard>
  );
}
