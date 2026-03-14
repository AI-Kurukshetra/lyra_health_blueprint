import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { ProgressPanel } from "@/components/employee/progress-panel";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeProgressPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Progress Tracking"
      subtitle="Log daily sentiment and identify trend patterns across your care journey."
    >
      <ProgressPanel />
    </EmployeePageShell>
  );
}
