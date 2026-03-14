import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { EmployeeAppointmentsPanel } from "@/components/employee/appointments-panel";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeAppointmentsPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Appointments"
      subtitle="Track upcoming sessions and access meeting rooms from one timeline."
    >
      <EmployeeAppointmentsPanel />
    </EmployeePageShell>
  );
}
