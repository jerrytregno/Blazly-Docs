import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardFeatureGate } from "@/components/billing/dashboard-feature-gate";
import { UpgradeModalProvider } from "@/components/billing/upgrade-modal-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataProvider } from "@/components/providers/data-provider";
import { PlanProvider } from "@/components/providers/plan-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PlanProvider>
        <UpgradeModalProvider>
          <DataProvider>
            <DashboardShell>
              <DashboardFeatureGate>{children}</DashboardFeatureGate>
            </DashboardShell>
          </DataProvider>
        </UpgradeModalProvider>
      </PlanProvider>
    </AuthGuard>
  );
}
