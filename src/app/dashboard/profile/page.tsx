"use client";

import { useEffect, useState } from "react";
import { SecurityPanel } from "@/components/profile/security-panel";
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/components/providers/plan-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { StatCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/toast";
import { getUserProfile, updateAccountProfile } from "@/lib/user-profile";
import { COUNTRIES, TIME_ZONES, formatTimeZoneLabel } from "@/lib/profile-constants";
import { formatPlanLabel } from "@/config/plans";
import { formatDate } from "@/lib/utils";
import type { AccountProfileInput, UserProfile } from "@/types/user";

const emptyForm: AccountProfileInput = {
  fullName: "",
  phone: "",
  companyName: "",
  country: "",
  timeZone: "America/New_York",
};

function validateForm(form: AccountProfileInput): string | null {
  if (!form.fullName.trim()) return "Full name is required.";
  if (form.fullName.trim().length < 2) return "Full name must be at least 2 characters.";
  if (!form.companyName.trim()) return "Company name is required.";
  if (!form.country) return "Please select a country.";
  if (!form.timeZone) return "Please select a time zone.";
  if (form.phone && !/^[\d\s+\-().]{7,20}$/.test(form.phone)) {
    return "Enter a valid phone number.";
  }
  return null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { plan } = usePlan();
  const { business, dashboard, rankings, reviews } = useData();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AccountProfileInput>(emptyForm);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserProfile(user.uid)
      .then((data) => {
        setProfile(data);
        if (data) {
          setForm({
            fullName: data.fullName || user.displayName || "",
            phone: data.phone,
            companyName: data.companyName || data.businessName,
            country: data.country,
            timeZone: data.timeZone || "America/New_York",
          });
        }
      })
      .catch(() => showToast("error", "Failed to load profile."))
      .finally(() => setLoading(false));
  }, [user]);

  const displayName =
    profile?.fullName || user?.displayName || profile?.companyName || "User";
  const email = user?.email ?? "—";
  const createdAt = profile?.createdAt
    ? formatDate(profile.createdAt)
    : user?.metadata.creationTime
      ? formatDate(user.metadata.creationTime)
      : "—";

  const stats = {
    businesses: business?.name ? 1 : 0,
    keywords: rankings?.keywords.length ?? 0,
    reviews: reviews?.inbox.length ?? dashboard?.metrics.totalReviews ?? 0,
    aiCompleted:
      dashboard?.strategistTasks.filter((t) => t.status === "completed").length ?? 0,
  };

  const handleSave = async () => {
    if (!user) return;
    const error = validateForm(form);
    if (error) {
      showToast("error", error);
      return;
    }
    setSaving(true);
    try {
      await updateAccountProfile(user.uid, form);
      const updated = await getUserProfile(user.uid);
      setProfile(updated);
      setEditing(false);
      showToast("success", "Profile updated successfully.");
    } catch {
      showToast("error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        fullName: profile.fullName || user?.displayName || "",
        phone: profile.phone,
        companyName: profile.companyName || profile.businessName,
        country: profile.country,
        timeZone: profile.timeZone || "America/New_York",
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <PageDataGuard>
        <ProfileSkeleton />
      </PageDataGuard>
    );
  }

  return (
    <PageDataGuard>
      <div className="space-y-8 pb-20 md:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
                  <p className="text-sm text-gray-600">{email}</p>
                </div>
                {!editing && (
                  <Button variant="gradient" onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountPlan">Plan</Label>
                <Input
                  id="accountPlan"
                  readOnly
                  value={formatPlanLabel(plan)}
                  className="cursor-default border-gray-200 bg-gray-50 text-gray-600"
                />
              </div>

              {!editing ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Phone", value: profile?.phone || "—" },
                      { label: "Company", value: profile?.companyName || profile?.businessName || "—" },
                      { label: "Country", value: profile?.country || "—" },
                      {
                        label: "Time Zone",
                        value: profile?.timeZone
                          ? formatTimeZoneLabel(profile.timeZone)
                          : "—",
                      },
                      {
                        label: "Member Since",
                        value: createdAt,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {row.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={form.fullName}
                          onChange={(e) =>
                            setForm({ ...form, fullName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={form.companyName}
                          onChange={(e) =>
                            setForm({ ...form, companyName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <select
                          id="country"
                          value={form.country}
                          onChange={(e) =>
                            setForm({ ...form, country: e.target.value })
                          }
                          required
                          className="auth-input h-10 w-full rounded-xl px-3 text-sm"
                        >
                          <option value="">Select country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeZone">Time Zone</Label>
                        <select
                          id="timeZone"
                          value={form.timeZone}
                          onChange={(e) =>
                            setForm({ ...form, timeZone: e.target.value })
                          }
                          required
                          className="auth-input h-10 w-full rounded-xl px-3 text-sm"
                        >
                          {TIME_ZONES.map((tz) => (
                            <option key={tz} value={tz}>
                              {formatTimeZoneLabel(tz)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button type="submit" variant="gradient" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Account Statistics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Business"
              value={stats.businesses}
              subtext="One profile per account"
            />
            <StatCard
              label="Keywords Tracked"
              value={stats.keywords}
              subtext="Across all groups"
            />
            <StatCard
              label="Reviews Managed"
              value={stats.reviews}
              subtext="In unified inbox"
            />
            <StatCard
              label="AI Recommendations Completed"
              value={stats.aiCompleted}
              subtext="Tasks finished"
            />
          </div>
        </div>

        {user && <SecurityPanel user={user} />}
      </div>
    </PageDataGuard>
  );
}
