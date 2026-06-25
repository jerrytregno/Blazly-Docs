"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronDown, Lock, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/components/providers/plan-provider";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

function isSectionActive(
  pathname: string,
  section: (typeof navigation)[number]
): boolean {
  if (section.href) return pathname === section.href;
  return (
    section.items?.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    ) ?? false
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { isPro } = usePlan();
  const { openUpgradeModal } = useUpgradeModal();
  const [loggingOut, setLoggingOut] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigation.forEach((section) => {
      if (isSectionActive(pathname, section)) {
        initial[section.id] = true;
      }
    });
    return initial;
  });

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const profileActive = pathname === "/dashboard/profile";
  const businessSettingsActive = pathname === "/dashboard/business-settings";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setSignOutOpen(false);
      onNavigate?.();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ConfirmDialog
        open={signOutOpen}
        title="Sign out?"
        description="You'll need to sign in again to access your dashboard and business data."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => !loggingOut && setSignOutOpen(false)}
      />
      <nav className="shrink-0 space-y-0.5 px-3 py-4">
        {navigation.map((section) => {
          const Icon = section.icon;
          const isDirectLink = !!section.href && !section.items;
          const sectionActive = isSectionActive(pathname, section);

          if (isDirectLink) {
            const needsUpgrade = !section.free && !isPro;

            if (needsUpgrade) {
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    openUpgradeModal(section.label);
                    onNavigate?.();
                  }}
                  className={cn(
                    "blazly-nav-item w-full",
                    sectionActive && "blazly-nav-item-active"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{section.label}</span>
                  {!section.free && (
                    <Lock className="ml-auto h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={section.id}
                href={section.href!}
                onClick={onNavigate}
                className={cn(
                  "blazly-nav-item",
                  sectionActive && "blazly-nav-item-active"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{section.label}</span>
                {!section.free && !isPro && (
                  <Lock className="ml-auto h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                )}
              </Link>
            );
          }

          const isOpen = expanded[section.id] ?? sectionActive;

          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                className="blazly-nav-item w-full"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{section.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 opacity-70 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && section.items && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                  {section.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "blazly-nav-sub block rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "blazly-nav-sub-active"
                            : "hover:bg-white/5"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-1 border-t border-slate-800 bg-[var(--sidebar-bg)] p-3">
        <Link
          href="/dashboard/business-settings"
          onClick={onNavigate}
          className={cn(
            "blazly-nav-item text-sm",
            businessSettingsActive && "blazly-nav-item-active"
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
          Business Settings
        </Link>
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={cn(
            "blazly-nav-item text-sm",
            profileActive && "blazly-nav-item-active"
          )}
        >
          <User className="h-4 w-4 shrink-0" />
          Profile
        </Link>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          disabled={loggingOut}
          className="blazly-nav-item w-full text-sm hover:text-red-300 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
