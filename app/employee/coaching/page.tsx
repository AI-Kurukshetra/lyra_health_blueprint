import { CoachingPanel } from "@/components/employee/coaching-panel";
import { EmployeePageShell } from "@/components/employee/employee-page-shell";
import { requireRole } from "@/lib/auth/session";

export default async function EmployeeCoachingPage() {
  await requireRole(["employee"]);

  return (
    <EmployeePageShell
      title="Mental health coaching"
      subtitle="Create a coaching plan, discover coaches, and book one-on-one coaching sessions."
    >
      <CoachingPanel />
    </EmployeePageShell>
  );
}
