import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rankProviders } from "@/lib/matching/algorithm";
import { requireProfileForApi } from "@/lib/data/profile";

const assessmentResponseSchema = z.object({
  concerns: z.array(z.string()).default([]),
  preferredLanguages: z.array(z.string()).default([]),
  preferredTimezone: z.string().default("UTC"),
  severityScore: z.number().int().min(0).max(27).default(0),
  careFormatPreference: z.enum(["video", "in_person", "hybrid"]).default("video"),
  coachingInterest: z.boolean().default(false),
  providerStyle: z.enum(["structured", "supportive", "directive", "no_preference"]).default("no_preference"),
  identityPreferences: z.array(z.string()).default([]),
  culturalPreferences: z.array(z.string()).default([]),
  urgencyLevel: z.enum(["routine", "priority", "urgent"]).default("routine"),
});

export async function GET() {
  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();

  const { data: latestAssessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("responses")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assessmentError) {
    return NextResponse.json({ error: assessmentError.message }, { status: 400 });
  }

  const defaultMatchingInput = {
    concerns: [] as string[],
    preferredLanguages: [] as string[],
    preferredTimezone: "UTC",
    severityScore: 0,
    careFormatPreference: "video" as const,
    coachingInterest: false,
    providerStyle: "no_preference" as const,
    identityPreferences: [] as string[],
    culturalPreferences: [] as string[],
    urgencyLevel: "routine" as const,
  };
  const parsedResponses = assessmentResponseSchema.safeParse(latestAssessment?.responses ?? null);
  const assessmentResponses = parsedResponses.success ? parsedResponses.data : defaultMatchingInput;
  const requiresAssessment = !latestAssessment?.responses || !parsedResponses.success;

  const { data: providers, error: providersError } = await supabase
    .from("providers")
    .select("id, specialties, languages, timezone, care_modalities, coaching_focus_areas, cultural_specialties, provider_style, gender_identity, years_experience, accepts_coaching")
    .eq("organization_id", profile.organization_id);

  if (providersError) {
    return NextResponse.json({ error: providersError.message }, { status: 400 });
  }

  const providerIds = (providers ?? []).map((provider) => provider.id);
  if (providerIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: providerProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", providerIds);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { data: availability, error: availabilityError } = await supabase
    .from("provider_availability")
    .select("id, provider_id, start_time, end_time")
    .eq("organization_id", profile.organization_id)
    .eq("session_kind", "therapy")
    .eq("is_booked", false)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 400 });
  }

  const nextAvailabilityByProvider = new Map<
    string,
    { availabilityId: string; startTime: string }
  >();
  const availabilityByProvider = new Map<
    string,
    Array<{ availabilityId: string; startTime: string; endTime: string }>
  >();

  for (const slot of availability ?? []) {
    if (!nextAvailabilityByProvider.has(slot.provider_id)) {
      nextAvailabilityByProvider.set(slot.provider_id, {
        availabilityId: slot.id,
        startTime: slot.start_time,
      });
    }
    const existing = availabilityByProvider.get(slot.provider_id) ?? [];
    existing.push({
      availabilityId: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
    });
    availabilityByProvider.set(slot.provider_id, existing);
  }

  const profileMap = new Map((providerProfiles ?? []).map((entry) => [entry.id, entry]));

  const ranked = rankProviders(
    assessmentResponses,
    (providers ?? []).map((provider) => {
      const nextSlot = nextAvailabilityByProvider.get(provider.id);
      return {
        id: provider.id,
        fullName: profileMap.get(provider.id)?.full_name ?? `Provider ${provider.id.slice(0, 6)}`,
        specialties: provider.specialties ?? [],
        languages: provider.languages ?? [],
        timezone: provider.timezone,
        nextAvailableAt: nextSlot?.startTime ?? null,
        careModalities: provider.care_modalities ?? [],
        coachingFocusAreas: provider.coaching_focus_areas ?? [],
        culturalSpecialties: provider.cultural_specialties ?? [],
        providerStyle: provider.provider_style ?? null,
        genderIdentity: provider.gender_identity ?? null,
        yearsExperience: provider.years_experience ?? null,
      };
    }),
  ).map((provider) => ({
    ...provider,
    nextAvailabilityId: nextAvailabilityByProvider.get(provider.id)?.availabilityId ?? null,
    availableSlots: (availabilityByProvider.get(provider.id) ?? []).slice(0, 12),
  }));

  return NextResponse.json({
    data: ranked.slice(0, 10),
    meta: { requiresAssessment },
  });
}
