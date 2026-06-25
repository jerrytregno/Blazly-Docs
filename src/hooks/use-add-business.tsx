"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resetBusinessData } from "@/lib/firestore/reset-business";
import { markAddingBusiness } from "@/lib/onboarding-flow";

export function useAddBusiness() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestAdd = () => setOpen(true);

  const confirmAdd = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await resetBusinessData(user.uid);
      markAddingBusiness();
      setOpen(false);
      router.replace("/onboarding");
    } catch {
      setError("Could not start business setup. Please try again.");
      setLoading(false);
    }
  };

  const dialog = (
    <>
      <ConfirmDialog
        open={open}
        title="Add another business?"
        description="You'll set up a new Google Business Profile using one of your paid slots. Your current business data will be cleared and replaced with the new profile."
        confirmLabel="Continue to setup"
        variant="primary"
        loading={loading}
        onConfirm={confirmAdd}
        onCancel={() => !loading && setOpen(false)}
      />
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );

  return { requestAdd, adding: loading, dialog };
}
