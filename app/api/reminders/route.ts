import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { reminderCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automated_reminders")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("user_id", profile.id)
    .order("remind_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = reminderCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automated_reminders")
    .insert({
      organization_id: profile.organization_id,
      user_id: profile.id,
      reminder_type: parsed.data.reminderType,
      title: parsed.data.title,
      details: parsed.data.details ?? null,
      remind_at: parsed.data.remindAt.toISOString(),
      timezone: parsed.data.timezone ?? "UTC",
      repeat_interval_minutes: parsed.data.repeatIntervalMinutes ?? null,
      status: "active",
      notified_at: null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "reminder.created",
    entity: "automated_reminder",
    entityId: data.id,
    metadata: {
      reminderType: parsed.data.reminderType,
      remindAt: parsed.data.remindAt.toISOString(),
      timezone: parsed.data.timezone ?? "UTC",
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}
