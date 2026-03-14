import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

export async function GET() {
  const profile = await requireProfileForApi(["provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crisis_events")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const profile = await requireProfileForApi(["provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = (await request.json().catch(() => null)) as
    | { id?: string; status?: "open" | "in_progress" | "resolved" }
    | null;

  if (!payload?.id || !payload.status) {
    return NextResponse.json({ error: "id and status are required." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    status: payload.status,
  };
  if (payload.status === "resolved") {
    updatePayload.resolved_by = profile.id;
    updatePayload.resolved_at = new Date().toISOString();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crisis_events")
    .update(updatePayload)
    .eq("id", payload.id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "crisis_event.updated",
    entity: "crisis_event",
    entityId: payload.id,
    metadata: { status: payload.status },
  });

  return NextResponse.json({ data });
}

