"use client";

import { useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { ASK_BLAZLY_EXAMPLES, AI_CAPABILITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightPanel } from "@/components/dashboard/widgets";
import { Send } from "lucide-react";

export default function RecommendationsPage() {
  const { dashboard } = useData();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (q: string) => {
    setQuestion(q);
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "strategist", question: q }) });
      const data = await res.json();
      setAnswer(res.ok ? data.answer : "Unable to generate a response.");
    } catch {
      setAnswer("Unable to generate a response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageDataGuard>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-400" />Ask Blazly AI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input className="auth-input h-11 flex-1 rounded-xl px-4 text-sm" placeholder="Ask anything about your local SEO..." value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && question && ask(question)} />
              <Button onClick={() => question && ask(question)} disabled={loading}><Send className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              {ASK_BLAZLY_EXAMPLES.map((ex) => (
                <button key={ex.question} type="button" onClick={() => ask(ex.question)} className="block w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10">
                  <p className="text-xs font-medium text-violet-300">{ex.category}</p>
                  <p className="mt-1 text-sm text-[#d4c4f5]">{ex.question}</p>
                </button>
              ))}
            </div>
            {(answer || loading) && (
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
                {loading ? <p className="text-sm text-[#b8a9d9]">Analyzing...</p> : <p className="whitespace-pre-wrap text-sm text-[#d4c4f5]">{answer}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Action Recommendations</CardTitle></CardHeader>
          <CardContent>
            {(dashboard?.strategistRecommendations.length ?? 0) === 0 ? (
              <p className="text-sm text-[#b8a9d9]">No recommendations yet.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard?.strategistRecommendations.map((rec) => (
                  <li key={rec.title} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div><p className="font-medium text-white">{rec.title}</p><p className="text-sm text-[#b8a9d9]">{rec.category} · Impact: {rec.impact}</p></div>
                    <Badge variant={rec.priority === "high" ? "warning" : "secondary"}>{rec.priority}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightPanel title="AI Insights" items={dashboard?.aiInsights.length ? dashboard.aiInsights : ["Insights will appear as your data grows"]} variant="ai" />
          <InsightPanel title="Quick Wins" items={dashboard?.aiRecommendations.length ? dashboard.aiRecommendations : ["Complete onboarding to get started"]} variant="ai" />
        </div>

        <Card>
          <CardHeader><CardTitle>AI Capabilities</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {AI_CAPABILITIES.map((cap) => (
              <div key={cap} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[#d4c4f5]">
                <Star className="h-4 w-4 text-violet-400" />{cap}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageDataGuard>
  );
}
