"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  ImageIcon,
  Menu,
  MessageSquare,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/profile-optimization", label: "Profile", icon: Sparkles },
  { href: "/dashboard/competitor-analysis", label: "Compete", icon: Users },
  { href: "/dashboard/review-management", label: "Reviews", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Stats", icon: BarChart3 },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <ToastProvider>
      <div className="dashboard-app flex h-[100dvh] max-h-[100dvh] overflow-hidden">
        <aside className="blazly-sidebar hidden shrink-0 flex-col lg:flex">
          <div className="shrink-0 border-b border-slate-800 px-5 py-5">
            <BrandLogo href="/dashboard" theme="dark" size="lg" showTagline />
          </div>
          <SidebarNav />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="blazly-sidebar absolute left-0 top-0 flex h-full w-[min(100%,280px)] flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                <BrandLogo href="/dashboard" theme="dark" size="lg" showTagline />
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="dashboard-app-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
            <BrandLogo href="/dashboard" size="sm" theme="light" />
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6 lg:px-10 lg:py-8 lg:pb-10">
            {children}
          </main>

          <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden">
            <div className="grid grid-cols-5 gap-0 px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
              {mobileNav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition",
                      active ? "text-indigo-600" : "text-slate-500"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="max-w-full truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </ToastProvider>
  );
}
