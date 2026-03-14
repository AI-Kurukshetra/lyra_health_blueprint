import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { availabilitySchema } from "@/lib/validation/schemas";

export async function GET() {
  const profile = await requireProfileForApi(["provider", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provider_availability")
    .select("*")
    .eq("provider_id", profile.id)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const limitResponse = enforceRateLimit({
    key: getRateLimitKey(request, "provider_availability_post"),
    maxRequests: 20,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const profile = await requireProfileForApi(["provider", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = availabilitySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provider_availability")
    .insert({
      organization_id: profile.organization_id,
      provider_id: profile.id,
      start_time: parsed.data.startTime.toISOString(),
      end_time: parsed.data.endTime.toISOString(),
      session_kind: parsed.data.sessionKind,
      is_booked: false,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "provider.availability.created",
    entity: "provider_availability",
    entityId: data.id,
    metadata: { sessionKind: parsed.data.sessionKind },
  });

  return NextResponse.json({ data }, { status: 201 });
}
