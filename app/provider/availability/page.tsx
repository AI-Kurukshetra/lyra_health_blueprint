import { RolePageShell } from "@/components/layout/role-page-shell";
import { ProviderAvailabilityPanel } from "@/components/provider/availability-panel";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderAvailabilityPage() {
  await requireRole(["provider", "system_admin"]);

  return (
    <RolePageShell
      title="Provider Availability"
      subtitle="Manage therapy and coaching slots employees can book in real time."
      roleLabel="Provider"
    >
      <ProviderAvailabilityPanel />
    </RolePageShell>
  );
}
