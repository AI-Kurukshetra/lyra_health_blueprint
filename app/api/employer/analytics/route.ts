import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfileForApi } from "@/lib/data/profile";

function daysBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const profile = await requireProfileForApi(["employer_admin", "system_admin"]);
  if (profile instanceof NextResponse) return profile;

  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    employeesResult,
    providersResult,
    assessmentsResult,
    appointmentsResult,
    completedAppointmentsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("role", "employee"),
    supabase
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    supabase
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("appointments")
      .select("id, employee_id, scheduled_at, created_at")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo),
  ]);

  if (
    employeesResult.error ||
    providersResult.error ||
    assessmentsResult.error ||
    appointmentsResult.error ||
    completedAppointmentsResult.error
  ) {
    return NextResponse.json(
      {
        error:
          employeesResult.error?.message ||
          providersResult.error?.message ||
          assessmentsResult.error?.message ||
          appointmentsResult.error?.message ||
          completedAppointmentsResult.error?.message,
      },
      { status: 400 },
    );
  }

  const appointments = appointmentsResult.data ?? [];
  const firstByEmployee = new Map<string, string>();
  for (const appointment of appointments) {
    const existing = firstByEmployee.get(appointment.employee_id);
    if (!existing || new Date(appointment.scheduled_at) < new Date(existing)) {
      firstByEmployee.set(appointment.employee_id, appointment.scheduled_at);
    }
  }

  const { data: firstAssessments } = await supabase
    .from("assessments")
    .select("employee_id, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  const firstAssessmentByEmployee = new Map<string, string>();
  for (const assessment of firstAssessments ?? []) {
    if (!firstAssessmentByEmployee.has(assessment.employee_id)) {
      firstAssessmentByEmployee.set(assessment.employee_id, assessment.created_at);
    }
  }

  const leadTimes: number[] = [];
  for (const [employeeId, firstAppointmentAt] of firstByEmployee.entries()) {
    const firstAssessmentAt = firstAssessmentByEmployee.get(employeeId);
    if (firstAssessmentAt) {
      leadTimes.push(daysBetween(firstAssessmentAt, firstAppointmentAt));
    }
  }

  const avgTimeToFirstAppointmentDays =
    leadTimes.length > 0
      ? Number((leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length).toFixed(2))
      : null;

  const data = {
    totalEmployees: employeesResult.count ?? 0,
    totalProviders: providersResult.count ?? 0,
    assessmentsLast30Days: assessmentsResult.count ?? 0,
    totalAppointments: appointments.length,
    completedSessionsLast30Days: completedAppointmentsResult.count ?? 0,
    avgTimeToFirstAppointmentDays,
  };

  return NextResponse.json({ data });
}

