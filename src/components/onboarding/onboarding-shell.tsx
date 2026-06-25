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
        <BrandLogo href="/signup" theme="dark" size="lg" showTagline />
        <div className="max-w-md space-y-6">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Let&apos;s set up your business
          </h2>
          <p className="text-indigo-200">
            We&apos;ll connect your Google Maps listing and run your first local SEO
            analysis in minutes.
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            {["Add your Maps link", "We fetch live GBP data", "Get your SEO score"].map(
              (step) => (
                <li key={step} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  {step}
                </li>
              )
            )}
          </ul>
        </div>
        <p className="text-xs text-slate-500">Step 1 of your local SEO journey</p>
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
