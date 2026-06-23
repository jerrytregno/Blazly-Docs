"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resetBusinessData } from "@/lib/firestore/reset-business";
import { markReplacingBusiness } from "@/lib/onboarding-flow";

export function useSwitchBusiness() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestSwitch = () => setOpen(true);

  const confirmSwitch = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await resetBusinessData(user.uid);
      markReplacingBusiness();
      setOpen(false);
      router.replace("/onboarding");
    } catch {
      setError("Could not reset business data. Try again from Business Settings.");
      setLoading(false);
    }
  };

  const dialog = (
    <>
      <ConfirmDialog
        open={open}
        title="Use a different business?"
        description="Your current business profile and all local SEO data will be cleared. You will set up a new business without creating a new account."
        confirmLabel="Continue to setup"
        loading={loading}
        onConfirm={confirmSwitch}
        onCancel={() => !loading && setOpen(false)}
      />
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
    </>
  );

  return { requestSwitch, switching: loading, dialog };
}
