"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { resolveFranchiseListings } from "@/lib/seo/franchise-listings";

export function useFranchiseListings() {
  const { business, rankings, dashboard } = useData();

  return useMemo(
    () =>
      resolveFranchiseListings({
        business,
        rankings,
        dashboard,
      }),
    [business, rankings, dashboard]
  );
}
