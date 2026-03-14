import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";
import type { AppRole } from "@/types/domain";

interface RouteParams {
  params: Promise<{ kind: string }>;
}

const kindRoles: Record<string, AppRole[]> = {
  "early-warning": ["provider", "employer_admin", "system_admin"],
  "workplace-stress": ["employer_admin", "system_admin"],
  "team-insights": ["employer_admin", "system_admin"],
  "utilization-forecast": ["employer_admin", "system_admin"],
  roi: ["employer_admin", "system_admin"],
  sentiment: ["provider", "employer_admin", "system_admin"],
};

function rolesForKind(kind: string): AppRole[] {
  return kindRoles[kind] ?? ["employer_admin", "system_admin"];
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { kind } = await params;
  const profile = await requireProfileForApi(rolesForKind(kind));
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();

  if (kind === "early-warning") {
    const [assessments, moods, crisis] = await Promise.all([
      supabase
        .from("assessments")
        .select("employee_id, risk_level, created_at")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("mood_entries")
        .select("employee_id, mood_score, created_at")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("crisis_events")
        .select("employee_id, status, severity, created_at")
        .eq("organization_id", profile.organization_id)
        .neq("status", "resolved"),
    ]);

    const moodByEmployee = new Map<string, number[]>();
    for (const entry of moods.data ?? []) {
      const list = moodByEmployee.get(entry.employee_id) ?? [];
      list.push(entry.mood_score);
      moodByEmployee.set(entry.employee_id, list);
    }

    const flags: Array<{ employeeId: string; severity: string; reasons: string[] }> = [];
    for (const assessment of assessments.data ?? []) {
      const reasons: string[] = [];
      if (assessment.risk_level === "critical" || assessment.risk_level === "high") {
        reasons.push(`risk level ${assessment.risk_level}`);
      }
      const moodsForEmployee = moodByEmployee.get(assessment.employee_id) ?? [];
      if (moodsForEmployee.length > 0) {
        const avg = moodsForEmployee.reduce((sum, value) => sum + value, 0) / moodsForEmployee.length;
        if (avg <= 3.5) {
          reasons.push("low mood trend");
        }
      }
      const hasOpenCrisis = (crisis.data ?? []).some((event) => event.employee_id === assessment.employee_id);
      if (hasOpenCrisis) reasons.push("open crisis event");

      if (reasons.length > 0) {
        flags.push({
          employeeId: assessment.employee_id,
          severity: reasons.includes("open crisis event")
            ? "critical"
            : reasons.includes("low mood trend")
              ? "high"
              : "medium",
          reasons,
        });
      }
    }

    return NextResponse.json({
      data: flags.slice(0, 50),
      summary: {
        totalFlags: flags.length,
        critical: flags.filter((flag) => flag.severity === "critical").length,
      },
    });
  }

  if (kind === "workplace-stress") {
    const [moods, assessments] = await Promise.all([
      supabase
        .from("mood_entries")
        .select("mood_score, created_at")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("assessments")
        .select("risk_level, created_at")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const moodAvg =
      (moods.data ?? []).length > 0
        ? Number(
            ((moods.data ?? []).reduce((sum, item) => sum + item.mood_score, 0) /
              (moods.data ?? []).length).toFixed(2),
          )
        : null;
    const highRiskCount = (assessments.data ?? []).filter((item) =>
      item.risk_level === "high" || item.risk_level === "critical",
    ).length;

    const stressIndex = moodAvg === null ? 0 : Number((Math.max(0, 10 - moodAvg) * 10).toFixed(1));

    return NextResponse.json({
      data: {
        stressIndex,
        avgMood: moodAvg,
        highRiskAssessments: highRiskCount,
      },
    });
  }

  if (kind === "team-insights") {
    const [employeeCount, sessions] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("role", "employee"),
      supabase
        .from("appointments")
        .select("status, session_kind")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const total = sessions.data?.length ?? 0;
    const completed = (sessions.data ?? []).filter((item) => item.status === "completed").length;
    const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      data: {
        activeEmployees: employeeCount.count ?? 0,
        sessionsLast30Days: total,
        completionRate,
      },
    });
  }

  if (kind === "utilization-forecast") {
    const [appointments, availability] = await Promise.all([
      supabase
        .from("appointments")
        .select("created_at")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("provider_availability")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .eq("is_booked", false)
        .gte("start_time", new Date().toISOString()),
    ]);

    const appointmentsPerMonth = (appointments.data?.length ?? 0) / 3;
    const forecastDemand = Math.round(appointmentsPerMonth * 1.12);
    const capacity = availability.data?.length ?? 0;
    const gap = forecastDemand - capacity;

    return NextResponse.json({
      data: {
        forecastDemand,
        capacity,
        gap,
        riskLevel: gap > 30 ? "high" : gap > 10 ? "medium" : "low",
      },
    });
  }

  if (kind === "roi") {
    const [appointments, moods] = await Promise.all([
      supabase
        .from("appointments")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("mood_entries")
        .select("mood_score")
        .eq("organization_id", profile.organization_id)
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const avgMood =
      (moods.data ?? []).length > 0
        ? (moods.data ?? []).reduce((sum, item) => sum + item.mood_score, 0) / (moods.data ?? []).length
        : 0;
    const productivityMultiplier = avgMood > 0 ? Number((1 + avgMood / 20).toFixed(2)) : 1;
    const estimatedReturn = Number(((appointments.data?.length ?? 0) * 35 * productivityMultiplier).toFixed(0));

    return NextResponse.json({
      data: {
        appointmentsLast90Days: appointments.data?.length ?? 0,
        avgMood: Number(avgMood.toFixed(2)),
        productivityMultiplier,
        estimatedReturnUsd: estimatedReturn,
      },
    });
  }

  if (kind === "sentiment") {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("body, flagged_crisis, created_at")
      .eq("organization_id", profile.organization_id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const negativeLexicon = ["panic", "hopeless", "overwhelmed", "anxious", "burnout", "unsafe"];
    const positiveLexicon = ["better", "calm", "hopeful", "stable", "grateful", "improving"];

    let score = 0;
    for (const message of messages ?? []) {
      const text = message.body.toLowerCase();
      if (negativeLexicon.some((term) => text.includes(term))) score -= 2;
      if (positiveLexicon.some((term) => text.includes(term))) score += 2;
      if (message.flagged_crisis) score -= 3;
    }

    return NextResponse.json({
      data: {
        messagesAnalyzed: messages?.length ?? 0,
        sentimentScore: score,
        status: score < -10 ? "critical" : score < 0 ? "watch" : "stable",
      },
    });
  }

  return NextResponse.json({ error: "Unsupported insight kind." }, { status: 400 });
}
