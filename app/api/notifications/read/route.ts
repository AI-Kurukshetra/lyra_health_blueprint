import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

const markReadSchema = z.object({
  all: z.boolean().optional(),
  ids: z.array(z.string().uuid()).optional(),
});

export async function PATCH(request: Request) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = markReadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", profile.organization_id)
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (!parsed.data.all) {
    const ids = parsed.data.ids ?? [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "Provide ids or all=true." }, { status: 400 });
    }
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "notification.read",
    entity: "notification",
    metadata: { all: parsed.data.all ?? false, ids: parsed.data.ids ?? [] },
  });

  return NextResponse.json({ ok: true });
}
