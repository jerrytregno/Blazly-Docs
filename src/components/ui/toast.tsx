"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

let pushToast: ((type: ToastType, message: string) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  pushToast?.(type, message);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    pushToast = (type, message) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex flex-col gap-2 lg:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md",
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
                : "border-red-500/30 bg-red-500/15 text-red-100"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
