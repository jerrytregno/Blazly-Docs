"use client";

import { BrandLogo } from "@/components/brand/logo";
import { CheckCircle2 } from "lucide-react";

interface OnboardingShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function OnboardingShell({ title, subtitle, children }: OnboardingShellProps) {
  return (
    <div className="auth-split">
      <div className="auth-split-brand">
        <div className="flex w-full max-w-md flex-col items-start">
          <BrandLogo href="/signup" theme="dark" size="lg" showTagline className="mb-8" />
          <div className="w-full space-y-8 text-left">
            <div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                Let&apos;s set up your business
              </h2>
              <p className="mt-4 text-base leading-relaxed text-indigo-200">
                We&apos;ll connect your Google Maps listing and run your first local SEO
                analysis in minutes.
              </p>
            </div>
            <ul className="inline-flex flex-col items-start space-y-3 text-left">
              {["Add your Maps link", "We fetch live GBP data", "Get your SEO score"].map(
                (step) => (
                  <li key={step} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-400" />
                    {step}
                  </li>
                )
              )}
            </ul>
            <p className="text-xs text-slate-500">Step 1 of your local SEO journey</p>
          </div>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-card">
          <div className="mb-8 lg:hidden">
            <BrandLogo href="/signup" size="md" showTagline className="justify-center" />
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
