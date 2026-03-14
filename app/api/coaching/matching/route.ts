import { NextResponse } from "next/server";
import { rankCoaches } from "@/lib/matching/coaching";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

export async function GET() {
  const profile = await requireProfileForApi(["employee"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("responses")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const responses = (latestAssessment?.responses ?? {}) as {
    concerns?: string[];
    preferredLanguages?: string[];
    preferredTimezone?: string;
    coachingInterest?: boolean;
  };

  const { data: plans } = await supabase
    .from("coaching_plans")
    .select("focus_areas")
    .eq("employee_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1);
  const planFocus = (plans?.[0]?.focus_areas ?? []) as string[];

  const input = {
    focusAreas: planFocus.length > 0 ? planFocus : responses.concerns ?? [],
    preferredLanguages: responses.preferredLanguages ?? [],
    preferredTimezone: responses.preferredTimezone ?? "UTC",
  };

  const { data: coaches, error: coachesError } = await supabase
    .from("providers")
    .select("id, coaching_focus_areas, languages, timezone, years_experience")
    .eq("organization_id", profile.organization_id)
    .eq("accepts_coaching", true);
  if (coachesError) {
    return NextResponse.json({ error: coachesError.message }, { status: 400 });
  }

  const coachIds = (coaches ?? []).map((coach) => coach.id);
  if (coachIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: coachProfiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", coachIds);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { data: coachingSlots, error: slotsError } = await supabase
    .from("provider_availability")
    .select("id, provider_id, start_time")
    .eq("organization_id", profile.organization_id)
    .eq("session_kind", "coaching")
    .eq("is_booked", false)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });
  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 400 });
  }

  const nextSlotByCoach = new Map<string, { availabilityId: string; startTime: string }>();
  for (const slot of coachingSlots ?? []) {
    if (!nextSlotByCoach.has(slot.provider_id)) {
      nextSlotByCoach.set(slot.provider_id, {
        availabilityId: slot.id,
        startTime: slot.start_time,
      });
    }
  }

  const coachNameMap = new Map((coachProfiles ?? []).map((entry) => [entry.id, entry.full_name ?? "Coach"]));

  const ranked = rankCoaches(
    input,
    (coaches ?? []).map((coach) => {
      const nextSlot = nextSlotByCoach.get(coach.id);
      return {
        id: coach.id,
        fullName: coachNameMap.get(coach.id) ?? "Coach",
        coachingFocusAreas: coach.coaching_focus_areas ?? [],
        languages: coach.languages ?? [],
        timezone: coach.timezone,
        yearsExperience: coach.years_experience ?? null,
        nextAvailableAt: nextSlot?.startTime ?? null,
        nextAvailabilityId: nextSlot?.availabilityId ?? null,
      };
    }),
  );

  return NextResponse.json({
    data: ranked.slice(0, 10),
    meta: {
      coachingInterest: responses.coachingInterest ?? false,
      sourceFocus: input.focusAreas,
    },
  });
}
