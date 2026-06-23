"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ReviewItem } from "@/types/firestore";

function toneFromRating(rating: number): string {
  if (rating >= 4) return "Positive Reviews";
  if (rating === 3) return "Neutral Reviews";
  return "Negative Reviews";
}

export function GoogleReviewCard({
  review,
  onMarkReplied,
  highlightUnanswered,
}: {
  review: ReviewItem;
  onMarkReplied?: (id: string) => void;
  highlightUnanswered?: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const fallbackReply = (regenerate: boolean) => {
    const positive = [
      "Thank you so much for your kind words! We truly appreciate you taking the time to leave a review and look forward to serving you again.",
      "We're thrilled to hear you had a great experience! Thanks for sharing your feedback — it means a lot to our team.",
      "What a wonderful review — thank you! We're grateful for your support and can't wait to welcome you back.",
    ];
    const negative = [
      "Thank you for sharing your feedback. We're sorry your experience wasn't what you expected, and we'd love the chance to make it right — please reach out to us directly.",
      "We appreciate you letting us know. Your experience matters to us, and we'd like to discuss how we can improve — please contact us at your convenience.",
    ];
    const pool = review.rating <= 2 ? negative : positive;
    const index = regenerate ? Math.floor(Date.now() / 1000) % pool.length : 0;
    return pool[index];
  };

  const generateReply = async (regenerate = false) => {
    setGenerating(true);
    setCopied(false);
    setError("");
    const previousReply = regenerate ? aiReply : undefined;

    try {
      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review-reply",
          tone: toneFromRating(review.rating),
          review: review.text,
          rating: review.rating,
          regenerate,
          previousReply,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setAiReply(data.reply);
      } else {
        setAiReply(fallbackReply(regenerate));
        if (!res.ok) {
          setError(data.error ?? "Could not reach AI — showing a suggested reply.");
        }
      }
    } catch {
      setAiReply(fallbackReply(regenerate));
      setError("Could not reach AI — showing a suggested reply.");
    } finally {
      setGenerating(false);
    }
  };

  const copyReply = async () => {
    if (!aiReply) return;
    await navigator.clipboard.writeText(aiReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={
        highlightUnanswered && !review.replied
          ? "border-amber-200 bg-amber-50/30"
          : "border-gray-200 bg-white"
      }
    >
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900">{review.author}</p>
              <Badge variant="secondary" className="text-xs">
                {review.source}
              </Badge>
              {!review.replied ? (
                <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Unanswered
                </Badge>
              ) : (
                <Badge className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                  Replied
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {review.text || <span className="italic text-gray-400">No written review</span>}
            </p>
            {review.date && (
              <p className="mt-2 text-xs text-gray-400">{review.date}</p>
            )}
          </div>
        </div>

        {!review.replied && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {!aiReply && !generating ? (
              <Button
                size="sm"
                onClick={() => generateReply(false)}
                disabled={generating}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate reply with AI
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                    AI suggested reply
                  </p>
                  {generating ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      {aiReply ? "Regenerating reply…" : "Generating reply…"}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-gray-800">{aiReply}</p>
                  )}
                </div>
                {error && !generating && (
                  <p className="text-xs text-amber-700">{error}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyReply}
                    disabled={generating || !aiReply}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateReply(true)}
                    disabled={generating}
                    className="gap-2"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {generating ? "Regenerating…" : "Regenerate"}
                  </Button>
                  {onMarkReplied && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onMarkReplied(review.id)}
                    >
                      Mark as replied
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
