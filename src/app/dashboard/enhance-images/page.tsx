"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ImageUploadZone } from "@/components/images/image-upload-zone";
import {
  BeforeAfterSlider,
  ScorePill,
} from "@/components/images/before-after-slider";
import { FeaturePanel } from "@/components/features/feature-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import {
  analyzeImageFile,
  downloadBlob,
  exportImageAs,
  fileToBase64,
} from "@/lib/images/image-analysis";
import type { ImageEnhancementQuota } from "@/lib/images/enhancement-quota";
import type { EnhancedImageItem } from "@/types/image-enhance";
import { cn } from "@/lib/utils";

export default function EnhanceImagesPage() {
  const { user } = useAuth();
  const { business } = useData();
  const [items, setItems] = useState<EnhancedImageItem[]>([]);
  const [bulkEnhancing, setBulkEnhancing] = useState(false);
  const [quota, setQuota] = useState<ImageEnhancementQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const loadQuota = useCallback(async () => {
    if (!user?.uid) {
      setQuota(null);
      setQuotaLoading(false);
      return;
    }

    setQuotaLoading(true);
    try {
      const res = await fetch(`/api/images/enhance?userId=${encodeURIComponent(user.uid)}`);
      const data = await res.json();
      if (res.ok) {
        setQuota(data.quota as ImageEnhancementQuota);
      }
    } catch {
      // quota display is optional; enhancement API still enforces limits
    } finally {
      setQuotaLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadQuota();
  }, [loadQuota, business?.businessId, business?.mapsPlaceId]);

  const atEnhancementLimit = quota != null && !quota.canEnhance;

  const addFiles = useCallback(async (files: File[]) => {
    const newItems: EnhancedImageItem[] = [];

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const originalUrl = URL.createObjectURL(file);

      try {
        const { metrics, scores, compliance } = await analyzeImageFile(file);
        newItems.push({
          id,
          fileName: file.name,
          originalUrl,
          mimeType: file.type || "image/jpeg",
          metrics,
          scores,
          compliance,
          status: "ready",
        });
      } catch {
        newItems.push({
          id,
          fileName: file.name,
          originalUrl,
          mimeType: file.type || "image/jpeg",
          metrics: {
            width: 0,
            height: 0,
            fileSizeBytes: file.size,
            fileSizeLabel: "",
            format: "unknown",
            brightness: 0,
            sharpness: 0,
            contrast: 0,
            noise: 0,
          },
          scores: {
            resolution: 0,
            brightness: 0,
            sharpness: 0,
            gbpCompliance: 0,
            overall: 0,
          },
          compliance: {
            passed: false,
            resolutionStatus: "fail",
            fileSizeStatus: "fail",
            formatStatus: "fail",
            messages: ["Could not analyze image"],
            recommendations: ["Try a different file format"],
          },
          status: "error",
          error: "Failed to analyze image",
        });
      }
    }

    setItems((prev) => [...newItems, ...prev]);
  }, []);

  const enhanceOne = async (id: string): Promise<boolean> => {
    const item = items.find((i) => i.id === id);
    if (!item || item.status === "enhancing") return true;
    if (!user?.uid) return false;
    if (quota != null && !quota.canEnhance) return false;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "enhancing", error: undefined } : i))
    );

    try {
      const res = await fetch(`/api/images/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          imageBase64: await fileToBase64(await urlToFile(item.originalUrl, item.fileName, item.mimeType)),
          mimeType: item.mimeType,
          fileName: item.fileName,
          width: item.metrics.width,
          height: item.metrics.height,
          businessName: business?.name,
          prompt: item.prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const nextQuota = data.quota as ImageEnhancementQuota | undefined;
        if (nextQuota) setQuota(nextQuota);
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "error",
                  error: data.error ?? "Enhancement failed",
                }
              : i
          )
        );
        return res.status !== 429 && (nextQuota?.canEnhance ?? true);
      }

      if (data.quota) setQuota(data.quota as ImageEnhancementQuota);

      const enhancedUrl = `data:${data.enhancedMimeType};base64,${data.enhancedImageBase64}`;

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                enhancedUrl,
                seo: data.seo,
                status: "enhanced",
              }
            : i
        )
      );

      const nextQuota = data.quota as ImageEnhancementQuota | undefined;
      return nextQuota?.canEnhance ?? true;
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "error",
                error: err instanceof Error ? err.message : "Enhancement failed",
              }
            : i
        )
      );
      return true;
    }
  };

  const enhanceBulk = async () => {
    if (atEnhancementLimit) return;
    const targets = items.filter((i) => i.status === "ready" || i.status === "error");
    if (!targets.length) return;
    setBulkEnhancing(true);
    for (const item of targets) {
      const canContinue = await enhanceOne(item.id);
      if (!canContinue) break;
    }
    setBulkEnhancing(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const avgOverall =
    items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.scores.overall, 0) / items.length)
      : 0;

  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhance Images</h1>
          <p className="mt-1 text-gray-600">
            Upload Google Business Profile photos, check GBP compliance, and enhance with AI.
          </p>
          {!quotaLoading && quota && (
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-medium text-gray-800">
                {quota.used} of {quota.limit}
              </span>{" "}
              AI enhancements used this month for this business profile
              {quota.remaining > 0 ? ` (${quota.remaining} remaining).` : "."}
            </p>
          )}
        </div>

        {atEnhancementLimit && quota?.limitMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {quota.limitMessage}
          </div>
        )}

        <ImageUploadZone onFiles={addFiles} disabled={bulkEnhancing} />

        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{items.length} images</Badge>
              <p className="text-sm text-gray-500">
                Avg. quality score: <span className="font-semibold text-gray-900">{avgOverall}</span>
              </p>
            </div>
            <Button
              onClick={enhanceBulk}
              disabled={
                bulkEnhancing ||
                atEnhancementLimit ||
                !items.some((i) => i.status === "ready" || i.status === "error")
              }
              className="gap-2"
            >
              {bulkEnhancing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Enhance all
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-gray-200">
              <CardContent className="p-0">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{item.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {item.metrics.width}×{item.metrics.height} · {item.metrics.fileSizeLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          item.compliance.passed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        )}
                      >
                        GBP {item.compliance.passed ? "Pass" : "Needs work"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    {item.enhancedUrl ? (
                      <BeforeAfterSlider
                        beforeSrc={item.originalUrl}
                        afterSrc={item.enhancedUrl}
                      />
                    ) : (
                      <img
                        src={item.originalUrl}
                        alt={item.fileName}
                        className="aspect-[4/3] w-full rounded-xl border border-gray-200 object-cover"
                      />
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`enhance-prompt-${item.id}`}
                          className="text-xs font-medium text-gray-600"
                        >
                          Describe your changes
                        </label>
                        <textarea
                          id={`enhance-prompt-${item.id}`}
                          className="auth-input min-h-[72px] w-full resize-y rounded-xl px-3 py-2 text-sm"
                          placeholder="e.g. Brighten the room, sharpen details, improve color balance…"
                          value={item.prompt ?? ""}
                          disabled={item.status === "enhancing" || bulkEnhancing}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, prompt: e.target.value } : i
                              )
                            )
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Don&apos;t enhance the image too much. Please enhance it reasonably and keep it natural.
                      </p>
                      <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => enhanceOne(item.id)}
                        disabled={
                          item.status === "enhancing" || bulkEnhancing || atEnhancementLimit
                        }
                        className="gap-2"
                      >
                        {item.status === "enhancing" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {item.status === "enhancing" ? "Implementing…" : "Implement change"}
                      </Button>
                      {item.enhancedUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={async () => {
                              const blob = await fetch(item.enhancedUrl!).then((r) => r.blob());
                              await downloadBlob(blob, `enhanced-${item.fileName}`);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            Enhanced
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const blob = await exportImageAs(item.enhancedUrl!, "jpeg", 0.88);
                              await downloadBlob(blob, `optimized-${item.fileName.replace(/\.\w+$/, "")}.jpg`);
                            }}
                          >
                            JPG
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const blob = await exportImageAs(item.enhancedUrl!, "png");
                              await downloadBlob(blob, `optimized-${item.fileName.replace(/\.\w+$/, "")}.png`);
                            }}
                          >
                            PNG
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const blob = await exportImageAs(item.enhancedUrl!, "webp", 0.85);
                              await downloadBlob(blob, `web-${item.fileName.replace(/\.\w+$/, "")}.webp`);
                            }}
                          >
                            Web
                          </Button>
                        </>
                      )}
                      </div>
                    </div>
                    {item.error && (
                      <p className="text-sm text-red-600">{item.error}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700">Overall quality</p>
                      <div className="flex items-center gap-3">
                        <p className="text-3xl font-bold text-indigo-600">{item.scores.overall}</p>
                        <ProgressBar value={item.scores.overall} className="h-2.5 flex-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <ScorePill label="Resolution" value={item.scores.resolution} />
                      <ScorePill label="Brightness" value={item.scores.brightness} />
                      <ScorePill label="Sharpness" value={item.scores.sharpness} />
                      <ScorePill label="GBP compliance" value={item.scores.gbpCompliance} />
                    </div>

                    <FeaturePanel
                      title="GBP compliance"
                      description="Google recommends 720×720+, max 5 MB, JPG/PNG."
                      className="border-0 shadow-none"
                    >
                      <ul className="space-y-2 text-sm">
                        {item.compliance.messages.map((msg, i) => (
                          <li key={i} className="flex gap-2 text-gray-700">
                            {item.compliance.passed ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            {msg}
                          </li>
                        ))}
                      </ul>
                      {item.compliance.recommendations.length > 0 && (
                        <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-blue-900">
                          <p className="font-medium">Recommendations</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800">
                            {item.compliance.recommendations.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </FeaturePanel>

                    {item.seo && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                        <p className="font-semibold text-gray-900">Image SEO suggestions</p>
                        <dl className="mt-3 space-y-2">
                          <div>
                            <dt className="text-xs uppercase text-gray-500">Filename</dt>
                            <dd className="font-medium text-gray-800">{item.seo.filename}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase text-gray-500">Alt text</dt>
                            <dd className="text-gray-800">{item.seo.altText}</dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase text-gray-500">Category</dt>
                            <dd>
                              <Badge variant="secondary">{item.seo.category}</Badge>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>Brightness: {item.metrics.brightness}</span>
                      <span>Sharpness: {item.metrics.sharpness}</span>
                      <span>Contrast: {item.metrics.contrast}</span>
                      <span>Clarity: {item.metrics.noise}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageDataGuard>
  );
}

async function urlToFile(url: string, name: string, type: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], name, { type: type || blob.type });
}
