"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UpgradeModalContextValue {
  openUpgradeModal: (featureLabel: string) => void;
  closeUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

function UpgradeRequiredModal({
  open,
  featureLabel,
  onCancel,
  onGoToPricing,
}: {
  open: boolean;
  featureLabel: string;
  onCancel: () => void;
  onGoToPricing: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-gray-900">Upgrade required</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          <span className="font-medium text-gray-800">{featureLabel}</span> is available on the
          Pro plan. Subscribe to unlock this feature.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onGoToPricing}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Pricing
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState("This feature");

  const openUpgradeModal = useCallback((label: string) => {
    setFeatureLabel(label);
    setOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setOpen(false);
  }, []);

  const goToPricing = useCallback(() => {
    setOpen(false);
    router.push("/dashboard/pricing");
  }, [router]);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal, closeUpgradeModal }}>
      {children}
      <UpgradeRequiredModal
        open={open}
        featureLabel={featureLabel}
        onCancel={closeUpgradeModal}
        onGoToPricing={goToPricing}
      />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  return ctx;
}
