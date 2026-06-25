import type { AccountPlan } from "@/types/user";

/** Main sidebar features included on the free plan */
export const FREE_FEATURE_IDS = [
  "dashboard",
  "profile-optimization",
  "competitor-analysis",
] as const;

export const FREE_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/profile-optimization",
  "/dashboard/competitor-analysis",
] as const;

/** Always reachable without a paid plan */
export const ALWAYS_FREE_ROUTES = [
  "/dashboard/pricing",
  "/dashboard/business-settings",
  "/dashboard/profile",
] as const;

export function hasProAccess(plan: AccountPlan): boolean {
  return plan === "Pro" || plan === "Enterprise";
}

export function formatPlanLabel(plan: AccountPlan): string {
  if (plan === "Pro") return "Pro user";
  if (plan === "Enterprise") return "Enterprise user";
  return "Free user";
}

export function isFreeDashboardRoute(pathname: string): boolean {
  if (ALWAYS_FREE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  return FREE_DASHBOARD_ROUTES.some((route) => {
    if (route === "/dashboard") return pathname === "/dashboard";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function routeRequiresPro(pathname: string): boolean {
  if (!pathname.startsWith("/dashboard")) return false;
  return !isFreeDashboardRoute(pathname);
}
