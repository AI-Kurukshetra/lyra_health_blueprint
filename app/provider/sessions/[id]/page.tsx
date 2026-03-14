import { notFound } from "next/navigation";
import { RolePageShell } from "@/components/layout/role-page-shell";
import { SessionRoom } from "@/components/sessions/session-room";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

interface AppointmentRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  provider_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "in_progress" | "completed" | "missed" | "cancelled";
  meeting_url: string | null;
  session_kind: "therapy" | "coaching";
}

export default async function SessionRoomPage({ params }: SessionPageProps) {
  const session = await requireRole(["provider", "employee", "system_admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle<AppointmentRecord>();

  if (error) {
    notFound();
  }

  let resolvedAppointment = appointment;
  if (!resolvedAppointment) {
    const { data: byAvailability } = await supabase
      .from("appointments")
      .select("*")
      .eq("availability_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<AppointmentRecord>();
    resolvedAppointment = byAvailability;
  }

  if (!resolvedAppointment) {
    notFound();
  }

  const role = session.profile?.role;
  const canAccess =
    role === "system_admin" ||
    resolvedAppointment.employee_id === session.userId ||
    resolvedAppointment.provider_id === session.userId;
  if (!canAccess) {
    notFound();
  }

  const participantIds = [resolvedAppointment.employee_id, resolvedAppointment.provider_id];
  const { data: names } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", participantIds);

  const nameMap = new Map((names ?? []).map((entry) => [entry.id, entry.full_name ?? "Participant"]));

  const roleLabel = role === "provider" ? "Provider" : role === "employee" ? "Employee" : "System Admin";
  const backHref =
    role === "provider"
      ? "/provider/appointments"
      : role === "employee"
        ? "/employee/appointments"
        : "/admin/messages";

  return (
    <RolePageShell
      title="Secure Session Room"
      subtitle="Join the scheduled therapy or coaching session with secure video and status controls."
      roleLabel={roleLabel}
      backHref={backHref}
    >
      <SessionRoom
        appointmentId={resolvedAppointment.id}
        scheduledAt={resolvedAppointment.scheduled_at}
        durationMinutes={resolvedAppointment.duration_minutes}
        status={resolvedAppointment.status}
        sessionKind={resolvedAppointment.session_kind ?? "therapy"}
        role={(role ?? "employee") as "employee" | "provider" | "system_admin"}
        providerLabel={nameMap.get(resolvedAppointment.provider_id) ?? "Provider"}
        employeeLabel={nameMap.get(resolvedAppointment.employee_id) ?? "Employee"}
      />
    </RolePageShell>
  );
}
