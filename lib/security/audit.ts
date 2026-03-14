import { createClient } from "@/lib/supabase/server";

interface AuditLogInput {
  organizationId: string | null;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

