import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { coachingPlanSchema } from "@/lib/validation/schemas";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const query = supabase
    .from("coaching_plans")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (profile.role === "employee") {
    query.eq("employee_id", profile.id);
  }
  if (profile.role === "provider") {
    query.eq("coach_id", profile.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = coachingPlanSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaching_plans")
    .insert({
      organization_id: profile.organization_id,
      employee_id: profile.id,
      focus_areas: parsed.data.focusAreas,
      goals: parsed.data.goals,
      preferred_frequency: parsed.data.preferredFrequency,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "coaching.plan.created",
    entity: "coaching_plan",
    entityId: data.id,
    metadata: {
      focusAreas: parsed.data.focusAreas,
      preferredFrequency: parsed.data.preferredFrequency,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}
