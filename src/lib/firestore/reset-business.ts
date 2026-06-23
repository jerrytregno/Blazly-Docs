import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  createDefaultBusiness,
  createDefaultDashboard,
  createDefaultRankings,
  createDefaultReviews,
} from "./defaults";

const emptyOnboarding = {
  businessName: "",
  website: "",
  category: "",
  location: "",
};

export async function resetBusinessData(userId: string): Promise<void> {
  const business = createDefaultBusiness(userId, emptyOnboarding);
  const dashboard = createDefaultDashboard(userId);
  const reviews = createDefaultReviews(userId);
  const rankings = createDefaultRankings(userId, "");
  const ts = serverTimestamp();

  await Promise.all([
    setDoc(doc(db, "businesses", userId), { ...business, updatedAt: ts }),
    setDoc(doc(db, "dashboard", userId), { ...dashboard, updatedAt: ts }),
    setDoc(doc(db, "reviews", userId), { ...reviews, updatedAt: ts }),
    setDoc(doc(db, "rankings", userId), { ...rankings, updatedAt: ts }),
    setDoc(
      doc(db, "users", userId),
      {
        businessName: "",
        website: "",
        category: "",
        location: "",
        companyName: "",
        onboardingComplete: false,
        updatedAt: ts,
      },
      { merge: true }
    ),
  ]);
}

export async function hasActiveBusiness(userId: string): Promise<boolean> {
  const { getBusiness } = await import("./collections");
  const business = await getBusiness(userId);
  return Boolean(business.name?.trim());
}
