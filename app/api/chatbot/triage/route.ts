import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfileForApi } from "@/lib/data/profile";

const triageSchema = z.object({
  message: z.string().min(4).max(4000),
});

const escalationTerms = ["self-harm", "suicide", "unsafe", "harm", "can't cope", "panic attack"];

export async function POST(request: Request) {
  const profile = await requireProfileForApi(["employee", "provider", "employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const payload = await request.json().catch(() => null);
  const parsed = triageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const text = parsed.data.message.toLowerCase();
  const isEscalation = escalationTerms.some((term) => text.includes(term));

  const suggestions: string[] = [];
  if (text.includes("sleep")) suggestions.push("Try a 10-minute wind-down breathing routine before bed.");
  if (text.includes("stress") || text.includes("burnout")) suggestions.push("Use a 2-minute reset exercise and schedule a coaching check-in.");
  if (text.includes("anxiety")) suggestions.push("Practice box breathing (4-4-4-4) and log your trigger in progress tracking.");
  if (text.includes("relationship")) suggestions.push("Consider therapy matching with relationship specialization.");
  if (suggestions.length === 0) {
    suggestions.push("Complete a self-assessment to improve recommendations.");
    suggestions.push("Try a short grounding exercise and reflect in mood tracking.");
  }

  return NextResponse.json({
    data: {
      urgency: isEscalation ? "critical" : "routine",
      escalated: isEscalation,
      suggestions,
      nextActions: isEscalation
        ? ["Contact crisis support immediately.", "Flag a crisis message to your provider."]
        : ["Book therapy or coaching from dashboard.", "Track mood for 7 days to see trend changes."],
    },
  });
}
