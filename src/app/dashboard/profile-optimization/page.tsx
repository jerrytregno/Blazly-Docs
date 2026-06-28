"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ProfileScoreCards } from "@/components/profile/profile-score-cards";
import { ProfileRecommendationCard } from "@/components/profile/profile-recommendation-card";
import {
  descriptionCharStatus,
  GbpDescriptionGuidelines,
} from "@/components/profile/gbp-description-guidelines";
import { FeaturePanel } from "@/components/features/feature-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { isLikelyMapsLink, normalizeMapsKey } from "@/lib/seo/maps-place";
import type {
  ProfileEnhancement,
  ProfileOptimizationDoc,
  ProfileRecommendation,
} from "@/types/firestore";

const SECTION_LABELS: Record<string, string> = {
  businessInformation: "Business Information",
  businessDescription: "Business Description",
  reviewsOptimization: "Reviews Optimization",
  photosOptimization: "Photos Optimization",
  servicesOptimization: "Services Optimization",
  gbpOptimization: "Google Business Profile",
};

function FieldStatusBadge({ status }: { status: string }) {
  const styles =
    status === "complete"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "incomplete"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <Badge className={cn("capitalize", styles)}>
      {status}
    </Badge>
  );
}

export default function ProfileOptimizationPage() {
  const { user } = useAuth();
  const { business, saveProfileOptimization, profileOptimization: cachedProfile } = useData();
  const [doc, setDoc] = useState<ProfileOptimizationDoc | null>(null);
  const [mapsLink, setMapsLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceComplete, setEnhanceComplete] = useState(false);
  const [error, setError] = useState("");
  const lastFetchedKey = useRef("");
  const autoFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyzeProfile = useCallback(
    async (link: string) => {
      if (!user) return;
      const trimmed = link.trim();
      if (!trimmed) return;

      const mapsKey = normalizeMapsKey(trimmed);
      setAnalyzing(true);
      setEnhanceComplete(false);
      setError("");
      try {
        const res = await fetch("/api/profile/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            mapsLink: trimmed,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Analysis failed");

        const nextDoc: ProfileOptimizationDoc = {
          userId: user.uid,
          enhancement: null,
          websiteUrl: "",
          error: null,
          ...data,
        };
        setDoc(nextDoc);
        lastFetchedKey.current = mapsKey;
        await saveProfileOptimization(nextDoc);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setAnalyzing(false);
      }
    },
    [user, saveProfileOptimization]
  );

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (cachedProfile?.analyzedAt && cachedProfile.snapshot) {
        const businessMaps = business?.mapsPlaceId?.trim() ?? "";
        const dataKey = normalizeMapsKey(cachedProfile.mapsLink);
        const businessKey = normalizeMapsKey(businessMaps);
        if (!businessKey || !dataKey || businessKey === dataKey) {
          setDoc({ ...cachedProfile, userId: user.uid, enhancement: cachedProfile.enhancement ?? null });
          if (cachedProfile.mapsLink) {
            setMapsLink(cachedProfile.mapsLink);
            lastFetchedKey.current = dataKey;
          } else if (businessMaps) {
            setMapsLink(businessMaps);
          }
          return;
        }
      }

      const res = await fetch(`/api/profile/analyze?userId=${user.uid}`);
      if (!res.ok) return;

      const data = (await res.json()) as ProfileOptimizationDoc;
      const businessMaps = business?.mapsPlaceId?.trim() ?? "";
      const dataKey = normalizeMapsKey(data.mapsLink);
      const businessKey = normalizeMapsKey(businessMaps);

      if (businessKey && dataKey && businessKey !== dataKey) {
        setDoc(null);
        setMapsLink(businessMaps);
        lastFetchedKey.current = "";
        return;
      }

      setDoc(data);
      if (data.mapsLink) {
        setMapsLink(data.mapsLink);
        lastFetchedKey.current = dataKey;
      } else if (businessMaps) {
        setMapsLink(businessMaps);
      }
    } catch {
      // ignore initial load errors
    } finally {
      setLoading(false);
    }
  }, [user, business?.mapsPlaceId, cachedProfile]);

  useEffect(() => {
    const businessMaps = business?.mapsPlaceId?.trim();
    if (!businessMaps) return;
    setMapsLink((prev) => {
      if (!prev.trim()) return businessMaps;
      const prevKey = normalizeMapsKey(prev);
      const bizKey = normalizeMapsKey(businessMaps);
      if (prevKey === bizKey) return prev;
      return businessMaps;
    });
  }, [business?.mapsPlaceId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const trimmed = mapsLink.trim();
    if (!trimmed || !user || !isLikelyMapsLink(trimmed)) return;

    const mapsKey = normalizeMapsKey(trimmed);
    if (mapsKey === lastFetchedKey.current) return;

    if (
      cachedProfile?.analyzedAt &&
      cachedProfile.snapshot &&
      mapsKey === normalizeMapsKey(cachedProfile.mapsLink || business?.mapsPlaceId || "")
    ) {
      lastFetchedKey.current = mapsKey;
      if (!doc) {
        setDoc({
          ...cachedProfile,
          userId: user.uid,
          enhancement: cachedProfile.enhancement ?? null,
        });
      }
      return;
    }

    if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current);
    autoFetchTimer.current = setTimeout(() => {
      void analyzeProfile(trimmed);
    }, 700);

    return () => {
      if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current);
    };
  }, [mapsLink, user, analyzeProfile, cachedProfile, business?.mapsPlaceId, doc]);

  const handleAnalyze = () => {
    if (!mapsLink.trim()) return;
    if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current);
    void analyzeProfile(mapsLink);
  };

  const handleEnhance = async () => {
    if (!user) return;
    setEnhancing(true);
    setEnhanceComplete(false);
    setError("");
    try {
      const res = await fetch("/api/profile/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enhancement failed");
      setDoc((prev) =>
        prev ? { ...prev, enhancement: data.enhancement as ProfileEnhancement } : prev
      );
      await saveProfileOptimization({ enhancement: data.enhancement });
      setEnhanceComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enhancement failed");
    } finally {
      setEnhancing(false);
    }
  };

  const snapshot = doc?.snapshot;
  const enhancement = doc?.enhancement;
  const mapsKey = normalizeMapsKey(mapsLink);
  const docKey = normalizeMapsKey(doc?.mapsLink ?? "");
  const profileMatchesLink = Boolean(snapshot && mapsKey && docKey && mapsKey === docKey);
  const showProfile = profileMatchesLink && snapshot;
  const linkChanged = Boolean(snapshot && mapsKey && docKey && mapsKey !== docKey);

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Optimization</h1>
          <p className="mt-1 text-gray-600">
            Audit your Google Business Profile and get AI-powered recommendations to improve
            local SEO.
          </p>
        </div>

        <Card className="border-gray-200 bg-white">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="maps">Google Maps / GBP Link</Label>
              <Input
                id="maps"
                placeholder="Paste your Google Maps link or Place ID"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Paste your Google Maps link — profile details fetch automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleAnalyze} disabled={analyzing || enhancing || !mapsLink.trim()}>
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {analyzing ? "Fetching profile…" : "Refresh profile"}
              </Button>
              {showProfile && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEnhance}
                    disabled={enhancing || analyzing}
                    className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    {enhancing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {enhancing ? "Generating…" : "Enhance Profile"}
                  </Button>
                  {enhanceComplete && !enhancing && (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Completed — you can view the results below.
                    </p>
                  )}
                </>
              )}
            </div>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {loading && !showProfile && !analyzing ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : analyzing && !showProfile ? (
          <Card className="border-gray-200">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-4 font-medium text-gray-900">Fetching Google Business Profile…</p>
              <p className="mt-1 text-sm text-gray-500">Loading live data for your Maps link</p>
            </CardContent>
          </Card>
        ) : linkChanged && !analyzing ? (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="py-10 text-center">
              <p className="font-medium text-gray-900">Maps link updated</p>
              <p className="mt-1 text-sm text-gray-600">
                Profile below is from a previous business. Fetching will start automatically, or
                click Refresh profile.
              </p>
            </CardContent>
          </Card>
        ) : showProfile ? (
          <>
            <ProfileScoreCards scores={doc!.scores} />

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{snapshot.name}</h2>
                  <p className="text-sm text-gray-500">
                    Profile Completion · {doc!.scores.profileCompleteness}%
                  </p>
                </div>
                {doc?.analyzedAt && (
                  <p className="text-xs text-gray-400">
                    Last analyzed {new Date(doc.analyzedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <ProgressBar value={doc!.scores.profileCompleteness} className="h-3" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-gray-200">
                <CardContent className="space-y-4 p-5">
                  <h3 className="font-semibold text-gray-900">Business details</h3>
                  {[
                    { icon: MapPin, label: "Address", value: snapshot.address },
                    { icon: Phone, label: "Phone", value: snapshot.phone },
                    { icon: Globe, label: "Website", value: snapshot.website },
                    { icon: Building2, label: "Category", value: snapshot.primaryCategory },
                    { icon: Clock, label: "Hours", value: snapshot.hoursSummary },
                  ].map((row) => (
                    <div key={row.label} className="flex gap-3 text-sm">
                      <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">
                          {row.label}
                        </p>
                        <p className="text-gray-800">{row.value || "—"}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="space-y-4 p-5">
                  <h3 className="font-semibold text-gray-900">Reputation & media</h3>
                  <div className="flex gap-3 text-sm">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">Reviews</p>
                      <p className="text-gray-800">
                        {snapshot.reviewsCount} reviews · {snapshot.averageRating}★ average
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">Photos</p>
                      <p className="text-gray-800">{snapshot.photosCount} photos</p>
                    </div>
                  </div>
                  {snapshot.services.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">Services</p>
                      <p className="mt-1 text-sm text-gray-800">
                        {snapshot.services.join(", ")}
                      </p>
                    </div>
                  )}
                  {snapshot.description && (
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">Description</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">
                        {snapshot.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <FeaturePanel
              title="Profile field audit"
              description="Missing or incomplete fields compared to local SEO best practices."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {doc!.fieldAudit.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{field.label}</p>
                      {field.value && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">{field.value}</p>
                      )}
                      {field.tip && field.status !== "complete" && (
                        <p className="mt-1 text-xs text-gray-400">{field.tip}</p>
                      )}
                    </div>
                    <FieldStatusBadge status={field.status} />
                  </div>
                ))}
              </div>
            </FeaturePanel>

            {enhancement && (
              <>
                {enhancement.optimizedDescription && (
                  <FeaturePanel title="AI-optimized description">
                    <div className="space-y-4">
                      <GbpDescriptionGuidelines />
                      <div>
                        <p
                          className={`text-xs font-medium ${descriptionCharStatus(enhancement.optimizedDescription.length).className}`}
                        >
                          {descriptionCharStatus(enhancement.optimizedDescription.length).label}
                        </p>
                        <p className="mt-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-sm leading-relaxed text-gray-800">
                          {enhancement.optimizedDescription}
                        </p>
                        {enhancement.optimizedDescription.length > 250 && (
                          <p className="mt-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Above-the-fold preview (~250 chars):</span>{" "}
                            {enhancement.optimizedDescription.slice(0, 250)}
                            …
                          </p>
                        )}
                      </div>
                    </div>
                  </FeaturePanel>
                )}

                <FeaturePanel
                  title="Action plan"
                  description="Prioritized improvements by timeline."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { title: "Quick wins", items: enhancement.actionPlan.quickWins, color: "border-emerald-200 bg-emerald-50/50" },
                      { title: "Short-term (1–2 weeks)", items: enhancement.actionPlan.shortTerm, color: "border-indigo-200 bg-indigo-50/50" },
                      { title: "Long-term (1–3 months)", items: enhancement.actionPlan.longTerm, color: "border-violet-200 bg-violet-50/50" },
                    ].map((block) => (
                      <div
                        key={block.title}
                        className={cn("rounded-xl border p-4", block.color)}
                      >
                        <h4 className="font-semibold text-gray-900">{block.title}</h4>
                        <ul className="mt-3 space-y-2">
                          {block.items.length === 0 ? (
                            <li className="text-sm text-gray-500">No items</li>
                          ) : (
                            block.items.map((item, i) => (
                              <li key={i} className="flex gap-2 text-sm text-gray-700">
                                <span className="text-indigo-500">•</span>
                                {item}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </FeaturePanel>

                {(Object.entries(enhancement.sections) as [string, ProfileRecommendation[]][]).map(
                  ([key, items]) =>
                  items.length > 0 ? (
                    <FeaturePanel
                      key={key}
                      title={SECTION_LABELS[key] ?? key}
                      description={
                        key === "businessDescription"
                          ? "Optimize your GBP description for length, keywords, and the Read more fold."
                          : "Expand each card for details and actions."
                      }
                    >
                      <div className="space-y-3">
                        {key === "businessDescription" && <GbpDescriptionGuidelines compact />}
                        {items.map((rec) => (
                          <ProfileRecommendationCard key={rec.id} recommendation={rec} />
                        ))}
                      </div>
                    </FeaturePanel>
                  ) : null
                )}
              </>
            )}
          </>
        ) : (
          <Card className="border-gray-200">
            <CardContent className="py-16 text-center">
              <Building2 className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 font-medium text-gray-900">No profile data yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Enter your Google Maps link to load your current business profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageDataGuard>
  );
}
