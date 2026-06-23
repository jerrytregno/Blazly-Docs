"use client";

import { useData } from "@/components/providers/data-provider";
import { DataError, DataLoading } from "@/components/data/data-states";

export function usePageData() {
  const data = useData();
  return data;
}

export function PageDataGuard({ children }: { children: React.ReactNode }) {
  const { loading, error, refresh } = useData();

  if (loading) return <DataLoading />;
  if (error) return <DataError message={error} onRetry={refresh} />;

  return <>{children}</>;
}
