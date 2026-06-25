"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { hasProAccess } from "@/config/plans";
import { getUserProfile } from "@/lib/user-profile";
import type { AccountPlan } from "@/types/user";

interface PlanContextValue {
  plan: AccountPlan;
  businessSlots: number;
  loading: boolean;
  isPro: boolean;
  refreshPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<AccountPlan>("Free");
  const [businessSlots, setBusinessSlots] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshPlan = async () => {
    if (!user) {
      setPlan("Free");
      setBusinessSlots(0);
      setLoading(false);
      return;
    }
    const profile = await getUserProfile(user.uid);
    setPlan(profile?.plan ?? "Free");
    setBusinessSlots(profile?.businessSlots ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void refreshPlan();
  }, [user?.uid]);

  return (
    <PlanContext.Provider
      value={{
        plan,
        businessSlots,
        loading,
        isPro: hasProAccess(plan),
        refreshPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
