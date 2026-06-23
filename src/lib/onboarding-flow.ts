const PENDING_ONBOARDING_KEY = "blazly-pending-onboarding";
const REPLACING_BUSINESS_KEY = "blazly-replacing-business";

export function markPendingOnboarding() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PENDING_ONBOARDING_KEY, "1");
  }
}

export function clearPendingOnboarding() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PENDING_ONBOARDING_KEY);
    sessionStorage.removeItem(REPLACING_BUSINESS_KEY);
  }
}

export function hasPendingOnboarding() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PENDING_ONBOARDING_KEY) === "1";
}

export function markReplacingBusiness() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PENDING_ONBOARDING_KEY, "1");
    sessionStorage.setItem(REPLACING_BUSINESS_KEY, "1");
  }
}

export function isReplacingBusiness() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(REPLACING_BUSINESS_KEY) === "1";
}

export function canAccessBusinessSetup(onboardingComplete: boolean, hasBusiness: boolean) {
  if (hasPendingOnboarding()) return true;
  return !onboardingComplete || !hasBusiness;
}
