import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { sessionNoteSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const profile = await requireProfileForApi(["provider", "employee", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId");

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_notes")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const profile = await requireProfileForApi(["provider", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = sessionNoteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_notes")
    .insert({
      appointment_id: parsed.data.appointmentId,
      organization_id: profile.organization_id,
      provider_id: profile.id,
      employee_id: parsed.data.employeeId,
      note: parsed.data.note,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "session_note.created",
    entity: "session_note",
    entityId: data.id,
    metadata: { appointmentId: parsed.data.appointmentId },
  });

  return NextResponse.json({ data }, { status: 201 });
}

