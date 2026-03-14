import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { appointmentStatusUpdateSchema } from "@/lib/validation/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const profile = await requireProfileForApi(["provider", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { id } = await params;
  const payload = await request.json().catch(() => null);
  const parsed = appointmentStatusUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: appointment, error: lookupError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (lookupError || !appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  if (appointment.provider_id !== profile.id && profile.role !== "system_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "appointment.status.updated",
    entity: "appointment",
    entityId: id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ data });
}

