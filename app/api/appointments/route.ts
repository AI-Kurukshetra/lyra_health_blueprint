import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { appointmentCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  if (profile.role === "employee") {
    query = query.eq("employee_id", profile.id);
  }
  if (profile.role === "provider") {
    query = query.eq("provider_id", profile.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const limitResponse = enforceRateLimit({
    key: getRateLimitKey(request, "appointments_post"),
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = appointmentCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: appointment, error: bookingError } = await supabase.rpc("book_appointment", {
    p_provider_id: parsed.data.providerId,
    p_availability_id: parsed.data.availabilityId,
    p_session_kind: parsed.data.sessionKind,
  });

  if (bookingError || !appointment) {
    const message = bookingError?.message ?? "Unable to complete booking.";
    const isConflict =
      message.includes("no longer available") || message.includes("already booked");
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "appointment.created",
    entity: "appointment",
    entityId: appointment.id,
    metadata: { providerId: parsed.data.providerId, sessionKind: parsed.data.sessionKind },
  });

  return NextResponse.json({ data: appointment }, { status: 201 });
}
