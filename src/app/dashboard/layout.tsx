import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataProvider } from "@/components/providers/data-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DataProvider>
        <DashboardShell>{children}</DashboardShell>
      </DataProvider>
    </AuthGuard>
  );
}
