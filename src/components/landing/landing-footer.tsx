"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { FOOTER_LINKS } from "@/lib/landing-content";

const SOCIAL = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BrandLogo href="/" size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              AI-powered local SEO platform for Google Business Profile management,
              competitor intelligence, rank tracking, and review growth.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Blazly Local SEO. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Log In
            </Link>
            <Link href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
