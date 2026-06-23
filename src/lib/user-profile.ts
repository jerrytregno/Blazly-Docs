import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { initializeUserData } from "@/lib/firestore/collections";
import { hasActiveBusiness } from "@/lib/firestore/reset-business";
import type { AccountPlan, AccountProfileInput, OnboardingInput, UserProfile } from "@/types/user";

function toIso(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function parsePlan(value: unknown): AccountPlan {
  if (value === "Pro" || value === "Enterprise" || value === "Free") return value;
  return "Free";
}

function mapProfileData(userId: string, data: Record<string, unknown>): UserProfile {
  const businessName = (data.businessName as string) ?? "";
  return {
    userId,
    businessName,
    website: (data.website as string) ?? "",
    category: (data.category as string) ?? "",
    location: (data.location as string) ?? "",
    mapsPlaceId: (data.mapsPlaceId as string) ?? "",
    onboardingComplete: data.onboardingComplete === true,
    fullName: (data.fullName as string) ?? "",
    phone: (data.phone as string) ?? "",
    companyName: (data.companyName as string) ?? businessName,
    country: (data.country as string) ?? "",
    timeZone: (data.timeZone as string) ?? "America/New_York",
    plan: parsePlan(data.plan),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return mapProfileData(userId, snap.data());
}

export async function ensureUserProfile(userId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    userId,
    businessName: "",
    website: "",
    category: "",
    location: "",
    fullName: "",
    phone: "",
    companyName: "",
    country: "",
    timeZone: "America/New_York",
    plan: "Free",
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccountProfile(
  userId: string,
  input: AccountProfileInput
): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      companyName: input.companyName.trim(),
      country: input.country,
      timeZone: input.timeZone,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateUserBusinessProfile(
  userId: string,
  input: {
    businessName: string;
    website: string;
    category: string;
    location: string;
    mapsPlaceId?: string;
  }
): Promise<void> {
  const website = input.website.trim().replace(/^https?:\/\//, "");
  await setDoc(
    doc(db, "users", userId),
    {
      businessName: input.businessName.trim(),
      website,
      category: input.category.trim(),
      location: input.location.trim(),
      mapsPlaceId: input.mapsPlaceId?.trim() ?? "",
      companyName: input.businessName.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingInput
): Promise<void> {
  const website = input.website.trim().replace(/^https?:\/\//, "");
  const mapsPlaceId = input.mapsPlaceId?.trim() ?? "";

  await initializeUserData(userId, input);

  await setDoc(
    doc(db, "users", userId),
    {
      userId,
      businessName: input.businessName.trim(),
      website,
      category: input.category.trim(),
      location: input.location.trim(),
      mapsPlaceId,
      companyName: input.businessName.trim(),
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getPostAuthPath(userId: string): Promise<string> {
  const [profile, active] = await Promise.all([
    getUserProfile(userId),
    hasActiveBusiness(userId),
  ]);
  if (profile?.onboardingComplete === true && active) {
    return "/dashboard";
  }
  return "/onboarding";
}
