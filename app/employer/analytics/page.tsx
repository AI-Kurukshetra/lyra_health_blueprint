import { RolePageShell } from "@/components/layout/role-page-shell";
import { EmployerAnalyticsPanel } from "@/components/employer/analytics-panel";
import { requireRole } from "@/lib/auth/session";

export default async function EmployerAnalyticsPage() {
  await requireRole(["employer_admin", "system_admin"]);

  return (
    <RolePageShell
      title="Employer Analytics"
      subtitle="Review aggregated, anonymized adoption and care-access metrics across your workforce."
      roleLabel="Employer Admin"
    >
      <EmployerAnalyticsPanel />
    </RolePageShell>
  );
}
