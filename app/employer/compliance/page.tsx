import { RolePageShell } from "@/components/layout/role-page-shell";
import { CompliancePanel } from "@/components/employer/compliance-panel";
import { requireRole } from "@/lib/auth/session";

export default async function EmployerCompliancePage() {
  await requireRole(["employer_admin", "system_admin"]);

  return (
    <RolePageShell
      title="Compliance Reporting"
      subtitle="Generate audit-ready exports for governance reviews and policy verification."
      roleLabel="Employer Admin"
    >
      <CompliancePanel />
    </RolePageShell>
  );
}
