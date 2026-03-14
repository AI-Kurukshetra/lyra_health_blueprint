import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

const interventionLibrary = {
  stress: "Take a 3-minute breathing reset and one focused break in the next hour.",
  anxiety: "Use box breathing for 2 minutes and write down one controllable next step.",
  burnout: "Block a 15-minute recovery break and decline one non-essential task today.",
  sleep: "Set a fixed wind-down alarm 60 minutes before bedtime.",
  relationships: "Write a brief boundaries script before your next difficult conversation.",
};

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

  const concerns = ((latestAssessment?.responses as { concerns?: string[] } | null)?.concerns ?? []).map(
    (item) => item.toLowerCase(),
  );
  const prioritized = concerns.length > 0 ? concerns : ["stress"];

  const interventions = prioritized.slice(0, 3).map((concern, index) => ({
    id: `${concern}-${index}`,
    concern,
    suggestion:
      interventionLibrary[concern as keyof typeof interventionLibrary] ??
      "Take a 2-minute pause, hydrate, and schedule a short wellbeing check-in.",
    durationMinutes: concern === "burnout" ? 15 : 3,
  }));

  return NextResponse.json({ data: interventions });
}
