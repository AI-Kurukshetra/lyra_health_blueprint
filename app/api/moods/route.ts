import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { moodEntrySchema } from "@/lib/validation/schemas";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = moodEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mood_entries")
    .insert({
      organization_id: profile.organization_id,
      employee_id: profile.id,
      mood_score: parsed.data.moodScore,
      notes: parsed.data.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "mood_entry.created",
    entity: "mood_entry",
    entityId: data.id,
    metadata: { moodScore: parsed.data.moodScore },
  });

  return NextResponse.json({ data }, { status: 201 });
}

