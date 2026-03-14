import { RolePageShell } from "@/components/layout/role-page-shell";
import { ProviderAppointmentsPanel } from "@/components/provider/appointments-panel";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderAppointmentsPage() {
  await requireRole(["provider", "system_admin"]);

  return (
    <RolePageShell
      title="Provider Appointments"
      subtitle="Run session lifecycle updates and complete clinical follow-up documentation."
      roleLabel="Provider"
    >
      <ProviderAppointmentsPanel />
    </RolePageShell>
  );
}
