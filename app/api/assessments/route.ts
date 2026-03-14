import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/security/audit";
import { enforceRateLimit, getRateLimitKey } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { assessmentSchema } from "@/lib/validation/schemas";
import { requireProfileForApi } from "@/lib/data/profile";
import type { RiskLevel } from "@/types/domain";

function computeRiskLevel(severityScore: number): RiskLevel {
  if (severityScore >= 24) return "critical";
  if (severityScore >= 15) return "high";
  if (severityScore >= 8) return "medium";
  return "low";
}

export async function GET() {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const limitResponse = enforceRateLimit({
    key: getRateLimitKey(request, "assessments_post"),
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = assessmentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const riskLevel = computeRiskLevel(parsed.data.severityScore);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      organization_id: profile.organization_id,
      employee_id: profile.id,
      responses: parsed.data,
      risk_level: riskLevel,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: "assessment.created",
    entity: "assessment",
    entityId: data.id,
    metadata: { riskLevel },
  });

  if (riskLevel === "critical") {
    await supabase.from("crisis_events").insert({
      organization_id: profile.organization_id,
      employee_id: profile.id,
      triggered_by: profile.id,
      source: "assessment",
      severity: "critical",
      details: {
        reason: "Critical score from intake assessment",
      },
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
