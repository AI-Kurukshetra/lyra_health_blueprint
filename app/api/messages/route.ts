import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import { messageSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get("partnerId");

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (partnerId) {
    const { data: partner, error: partnerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("id", partnerId)
      .maybeSingle();

    if (partnerError) {
      return NextResponse.json({ error: partnerError.message }, { status: 400 });
    }
    if (!partner) {
      return NextResponse.json({ error: "Contact not found in your organization." }, { status: 404 });
    }

    query = query.or(
      `and(sender_id.eq.${profile.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${profile.id})`,
    );
  } else {
    query = query.or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const limitResponse = enforceRateLimit({
    key: getRateLimitKey(request, "messages_post"),
    maxRequests: 50,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  if (parsed.data.recipientId === profile.id) {
    return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
  }

  const { data: recipient, error: recipientError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("id", parsed.data.recipientId)
    .maybeSingle();

  if (recipientError) {
    return NextResponse.json({ error: recipientError.message }, { status: 400 });
  }
  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient is not available in your organization." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      organization_id: profile.organization_id,
      sender_id: profile.id,
      recipient_id: parsed.data.recipientId,
      body: parsed.data.body,
      flagged_crisis: parsed.data.flaggedCrisis,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "message.sent",
    entity: "message",
    entityId: data.id,
    metadata: { recipientId: parsed.data.recipientId, flaggedCrisis: parsed.data.flaggedCrisis },
  });

  if (parsed.data.flaggedCrisis) {
    await supabase.from("crisis_events").insert({
      organization_id: profile.organization_id,
      employee_id: profile.role === "employee" ? profile.id : parsed.data.recipientId,
      triggered_by: profile.id,
      source: "message",
      severity: "high",
      details: {
        messageId: data.id,
      },
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
