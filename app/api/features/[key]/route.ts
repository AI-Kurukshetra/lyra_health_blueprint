import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuditLog } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import type { AppRole } from "@/types/domain";

const featureRecordSchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().max(2000).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  status: z.string().min(2).max(40).default("active"),
  startsAt: z.string().datetime().optional(),
});

const featureRoleAccess: Record<string, AppRole[]> = {
  wellness_challenges: ["employee", "provider", "employer_admin", "system_admin"],
  group_therapy_sessions: ["employee", "provider", "system_admin"],
  automated_reminders: ["employee", "provider", "employer_admin", "system_admin"],
  family_support_resources: ["employee", "provider", "employer_admin", "system_admin"],
  personalized_care_plans: ["employee", "provider", "system_admin"],
  peer_support_network: ["employee", "provider", "system_admin"],
  provider_network_management: ["provider", "employer_admin", "system_admin"],
  integration_apis: ["system_admin"],
  insurance_integration: ["system_admin", "employer_admin"],
  vr_therapy_environments: ["employee", "provider", "system_admin"],
  biometric_integration: ["employee", "provider", "system_admin"],
  digital_therapeutic_modules: ["employee", "provider", "system_admin"],
  multi_language_support: ["employee", "provider", "employer_admin", "system_admin"],
  cultural_competency_matching: ["provider", "system_admin"],
  manager_training_platform: ["employer_admin", "system_admin"],
  mobile_app_access: ["employee", "provider", "employer_admin", "system_admin"],
  ai_early_warning: ["provider", "employer_admin", "system_admin"],
  real_time_sentiment_analysis: ["provider", "employer_admin", "system_admin"],
};

const selfScopedForEmployees = new Set<string>([
  "automated_reminders",
  "personalized_care_plans",
  "biometric_integration",
  "mobile_app_access",
  "digital_therapeutic_modules",
]);

function rolesForFeature(key: string): AppRole[] {
  return featureRoleAccess[key] ?? ["employee", "provider", "employer_admin", "system_admin"];
}

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { key } = await params;
  const profile = await requireProfileForApi(rolesForFeature(key));
  if (profile instanceof NextResponse) return profile;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const shouldScopeToMine =
    scope === "mine" ||
    (profile.role === "employee" && selfScopedForEmployees.has(key));

  const supabase = await createClient();
  let query = supabase
    .from("feature_records")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("feature_key", key)
    .order("created_at", { ascending: false })
    .limit(200);

  if (shouldScopeToMine) {
    query = query.eq("actor_id", profile.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { key } = await params;
  const profile = await requireProfileForApi(rolesForFeature(key));
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = featureRecordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feature_records")
    .insert({
      organization_id: profile.organization_id,
      feature_key: key,
      actor_id: profile.id,
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      payload: parsed.data.payload,
      status: parsed.data.status,
      starts_at: parsed.data.startsAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await createAuditLog({
    organizationId: profile.organization_id,
    actorId: profile.id,
    action: `feature.${key}.created`,
    entity: "feature_record",
    entityId: data.id,
  });

  return NextResponse.json({ data }, { status: 201 });
}
