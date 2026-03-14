import { RolePageShell } from "@/components/layout/role-page-shell";
import { ProviderMessagesPanel } from "@/components/provider/messages-panel";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderMessagesPage() {
  await requireRole(["provider", "system_admin"]);

  return (
    <RolePageShell
      title="Secure Messaging"
      subtitle="Coordinate patient communication and crisis escalation from one interactive console."
      roleLabel="Provider"
    >
      <ProviderMessagesPanel />
    </RolePageShell>
  );
}
