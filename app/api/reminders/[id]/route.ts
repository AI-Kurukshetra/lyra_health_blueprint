import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

const reminderUpdateSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  remindAt: z.string().datetime().optional(),
  title: z.string().min(2).max(120).optional(),
  details: z.string().max(1200).optional(),
  repeatIntervalMinutes: z.number().int().min(1).max(10080).optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { id } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = reminderUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.remindAt !== undefined) {
    updates.remind_at = parsed.data.remindAt;
    updates.notified_at = null;
  }
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.details !== undefined) updates.details = parsed.data.details;
  if (parsed.data.repeatIntervalMinutes !== undefined) {
    updates.repeat_interval_minutes = parsed.data.repeatIntervalMinutes;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automated_reminders")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .eq("user_id", profile.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "reminder.updated",
    entity: "automated_reminder",
    entityId: data.id,
    metadata: updates,
  });

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("automated_reminders")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .eq("user_id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "reminder.deleted",
    entity: "automated_reminder",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
